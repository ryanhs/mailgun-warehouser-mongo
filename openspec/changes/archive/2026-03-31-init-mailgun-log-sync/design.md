## Context

This is a TypeScript project (`mailgun-warehouser`) with `luxon` (date/time) and `dotenv` (env config) as key runtime dependencies. The project calls Mailgun's Logs API (`POST /v1/analytics/logs`) directly via `fetch()` rather than using the `mailgun.js` SDK. Events are persisted locally as JSONL files in `output/`, written incrementally per page as they're fetched.

Mailgun's Logs API provides paginated access to email events (delivered, opened, clicked, bounced, etc.) with a retention window. We capture these before they expire.

## Goals / Non-Goals

**Goals:**
- Fetch all Mailgun events for a given date range via the Logs API with full token-based pagination
- Store events as JSONL files in `output/` organized by date (`output/YYYY-MM-DD/events.jsonl`), written incrementally per page
- Support manual CLI execution and daily scheduled runs
- Handle Mailgun API pagination transparently (the API uses opaque page URLs)
- Idempotent fetches - re-running for the same date overwrites cleanly

**Non-Goals:**
- MongoDB storage (deferred to a future change despite the driver being installed)
- Real-time event streaming or webhooks
- Email content retrieval (only event metadata/logs)
- Multi-domain support in a single run (one domain per configuration)
- Web UI or API server

## Decisions

### 1. File-based storage over MongoDB
**Choice**: Store logs as JSONL files in `output/YYYY-MM-DD/events.jsonl`
**Rationale**: Simplest path to persistent storage. No database setup required. Files are easy to inspect, back up, and process with standard tools (`jq`, `wc`, `grep`). MongoDB integration can be layered on top in a future change.
**Alternative considered**: Direct MongoDB insertion - rejected for initial setup to minimize infrastructure requirements.

### 2. Direct HTTP fetch over mailgun.js SDK
**Choice**: Call the Mailgun Logs API (`POST /v1/analytics/logs`) directly via Node.js `fetch()` with Basic Auth.
**Rationale**: The `mailgun.js` SDK's `logs.list()` method was passing incorrect date formats (JS Date objects instead of RFC 2822 strings), causing 400 errors. Direct HTTP gives full control over the request body format. The Logs API requires RFC 2822 date strings and has a max page limit of 100.
**Alternative considered**: `mailgun.js` SDK - rejected due to date formatting bugs and abstraction mismatch with the actual API contract.

### 3. JSONL format with incremental writes
**Choice**: `output/YYYY-MM-DD/events.jsonl` with one JSON object per line, appended per page as fetched.
**Rationale**: Allows incremental writing (events appear on disk immediately as each page is fetched). Safe to append without managing JSON array brackets. Easy to process with streaming tools. No data loss if process is interrupted mid-sync.
**Alternative considered**: Single JSON array file written at end - rejected because large fetches (thousands of events) would lose all progress if interrupted.

### 4. Node.js built-in scheduling via setInterval / cron-style check
**Choice**: Simple interval-based check using `node-cron` or a lightweight approach with setInterval that triggers once daily.
**Rationale**: No external scheduler dependency needed. The process can run as a long-lived Node process or be triggered externally (cron, systemd timer). We'll provide both a one-shot CLI mode and a daemon mode.
**Alternative considered**: OS-level cron only - rejected because having an in-process option is more portable.

### 5. Luxon for date handling
**Choice**: Use Luxon (already installed) for all date arithmetic and formatting.
**Rationale**: Reliable timezone handling, clean API for date ranges, already a dependency.

## Risks / Trade-offs

- **[Mailgun API rate limits]** → Implement pagination delays and respect rate limit headers. For large volumes, add exponential backoff.
- **[Large event volumes]** → Mitigated by incremental JSONL writes (100 events per page flushed to disk immediately). Future optimization: split by event type.
- **[Disk space]** → JSON files accumulate over time. Not addressed in v1 - users manage their own retention/archival.
- **[No deduplication]** → Re-running for the same date overwrites the entire file. This is acceptable for idempotency but means partial failures require a full re-fetch of that day.
- **[Single domain]** → Only one Mailgun domain per configuration. Multi-domain requires multiple instances or a future enhancement.
