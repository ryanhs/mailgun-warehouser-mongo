# mailgun-warehouser

Syncs Mailgun event logs to MongoDB. Mailgun retains logs for a limited period (1-30 days depending on plan) -- this tool warehouses them in MongoDB for long-term analysis, troubleshooting, and auditing.

Designed to run as a Kubernetes CronJob (twice daily), or manually via CLI.

## Setup

```bash
yarn install
cp .env.example .env
# Edit .env with your credentials
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MAILGUN_API_KEY` | Yes | - | Your Mailgun API key |
| `MAILGUN_DOMAIN` | Yes | - | Domain to fetch logs for |
| `MONGODB_URI` | Yes | - | MongoDB connection string |
| `MAILGUN_REGION` | No | `us` | API region: `us` or `eu` |

## Usage

```bash
# Sync yesterday's events (default)
yarn sync

# Sync a specific date
yarn sync --date 2026-03-15
```

Each run fetches one day of events, upserts into MongoDB by event `id`, and exits. Re-running for the same date is safe -- existing rows are updated.

## Docker

```bash
docker build -t mailgun-warehouser .
docker run --rm \
  -e MAILGUN_API_KEY=... \
  -e MAILGUN_DOMAIN=... \
  -e MONGODB_URI=... \
  mailgun-warehouser
```

## Kubernetes CronJob

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: mailgun-warehouser
spec:
  schedule: "0 2,14 * * *"  # twice daily: 02:00 and 14:00 UTC
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: sync
            image: mailgun-warehouser:latest
            env:
            - name: MAILGUN_API_KEY
              valueFrom:
                secretKeyRef:
                  name: mailgun-warehouser
                  key: MAILGUN_API_KEY
            - name: MAILGUN_DOMAIN
              valueFrom:
                secretKeyRef:
                  name: mailgun-warehouser
                  key: MAILGUN_DOMAIN
            - name: MONGODB_URI
              valueFrom:
                secretKeyRef:
                  name: mailgun-warehouser
                  key: MONGODB_URI
          restartPolicy: OnFailure
```

## Storage

Two MongoDB collections:

- **`events`** -- All Mailgun event logs, deduplicated by event `id`
- **`syncs`** -- Sync metadata (date, domain, fetchedAt, eventCount)

### Indexes (created automatically)

- `{ id: 1 }` -- unique, deduplication
- `{ "@timestamp": 1 }` -- date range queries
- `{ event: 1, "@timestamp": 1 }` -- filter by event type
- `{ recipient: 1, "@timestamp": 1 }` -- lookup by recipient

### Querying

```bash
# Count events for a date
mongosh "$MONGODB_URI" --eval 'db.events.countDocuments({"@timestamp": {$gte: "2026-03-30", $lt: "2026-03-31"}})'

# Find delivered events
mongosh "$MONGODB_URI" --eval 'db.events.find({event: "delivered"}).limit(5).pretty()'

# Check sync history
mongosh "$MONGODB_URI" --eval 'db.syncs.find().sort({date: -1}).limit(10).pretty()'
```

## How It Works

- Calls Mailgun's Logs API (`POST /v1/analytics/logs`) directly via `fetch()`
- Paginates through results (100 events per page) with token-based pagination
- Upserts each page into MongoDB immediately via bulk `updateOne(..., { upsert: true })` on event `id`
- Re-syncing updates existing rows and inserts any missing rows
- Retries failed API requests with exponential backoff (max 3 retries)

## Project Structure

```
src/
  index.ts           # CLI entry point (--date)
  config.ts          # Environment variable loading and validation
  mailgun-client.ts  # Direct HTTP calls to Mailgun Logs API
  sync.ts            # Orchestrates fetch + storage per date
  mongodb.ts         # MongoDB connection, indexes, inserts
```
