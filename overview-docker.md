# ryanhs/mailgun-warehouser-mongo

Syncs Mailgun event logs to MongoDB. Mailgun retains logs for a limited period (1–30 days depending on plan) — this image warehouses them in MongoDB for long-term analysis, troubleshooting, and auditing.

Designed to run as a **Kubernetes CronJob** (twice daily), or manually via CLI.

---

## Quick Start

```bash
docker run --rm \
  -e MAILGUN_API_KEY=your-api-key \
  -e MAILGUN_DOMAIN=mg.example.com \
  -e MONGODB_URI=mongodb+srv://... \
  ryanhs/mailgun-warehouser-mongo
```

By default, syncs **yesterday's** events.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `MAILGUN_API_KEY` | Yes | — | Your Mailgun API key |
| `MAILGUN_DOMAIN` | Yes | — | Domain to fetch logs for |
| `MONGODB_URI` | Yes | — | MongoDB connection string |
| `MAILGUN_REGION` | No | `us` | API region: `us` or `eu` |

---

## Sync a Specific Date

Pass `--date` as the command:

```bash
docker run --rm \
  -e MAILGUN_API_KEY=... \
  -e MAILGUN_DOMAIN=... \
  -e MONGODB_URI=... \
  ryanhs/mailgun-warehouser-mongo \
  --date 2026-03-15
```

Re-running for the same date is safe — duplicates are silently skipped via a unique index on event `id`.

---

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
            image: ryanhs/mailgun-warehouser-mongo:latest
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

---

## MongoDB Storage

Two collections are created automatically:

- **`events`** — All Mailgun event logs, deduplicated by event `id`
- **`syncs`** — Sync metadata (date, domain, fetchedAt, eventCount)

### Indexes (created automatically)

| Index | Purpose |
|---|---|
| `{ id: 1 }` unique | Deduplication |
| `{ "@timestamp": 1 }` | Date range queries |
| `{ event: 1, "@timestamp": 1 }` | Filter by event type |
| `{ recipient: 1, "@timestamp": 1 }` | Lookup by recipient |

### Querying Examples

```bash
# Count events for a date
mongosh "$MONGODB_URI" --eval \
  'db.events.countDocuments({"@timestamp": {$gte: "2026-03-30", $lt: "2026-03-31"}})'

# Find delivered events
mongosh "$MONGODB_URI" --eval \
  'db.events.find({event: "delivered"}).limit(5).pretty()'

# Check sync history
mongosh "$MONGODB_URI" --eval \
  'db.syncs.find().sort({date: -1}).limit(10).pretty()'
```

---

## How It Works

- Calls Mailgun's Logs API (`POST /v1/analytics/logs`) via `fetch()`
- Paginates through results (100 events per page) with token-based pagination
- Inserts each page into MongoDB immediately — no data loss if interrupted
- Retries failed API requests with exponential backoff (max 3 retries)

---

## Source

[github.com/ryanhs/mailgun-warehouser](https://github.com/ryanhs/mailgun-warehouser)
