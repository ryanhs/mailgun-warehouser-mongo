## Context

The project currently stores Mailgun event logs as JSONL files in `output/YYYY-MM-DD/events.jsonl`. This works for warehousing but is impractical for querying. The `mongodb` driver (v6.12.1) is already installed, and a production MongoDB Atlas URI is available. This change replaces file storage with MongoDB entirely.

## Goals / Non-Goals

**Goals:**
- Store all fetched events in a MongoDB collection, inserted incrementally per page (same pattern as current JSONL writes)
- Create indexes for common query patterns (date, event type, recipient, domain)
- Track sync metadata per date in a separate collection
- Keep the same incremental write pattern -- events hit the database as each page arrives
- Clean removal of all file storage code

**Non-Goals:**
- Query API or analytics dashboard (future change)
- Backfilling existing JSONL data into MongoDB
- Sharding or replica set configuration (handled by Atlas)
- TTL / data retention policies (future change)

## Decisions

### 1. Collection design: single `events` collection
**Choice**: One flat `events` collection with all event types, plus a `syncs` collection for metadata.
**Rationale**: Simplest model. Events are already heterogeneous (delivered, opened, failed, etc.) and share common fields. A single collection with compound indexes covers all query patterns.
**Alternative considered**: Collection per event type -- rejected as over-segmentation and complicates the insert path.

### 2. Use `insertMany` with `ordered: false` per page
**Choice**: Bulk insert each page of events (up to 100 docs) via `insertMany` with `ordered: false`.
**Rationale**: Matches the current incremental pattern (one write per page). `ordered: false` continues inserting remaining docs if one fails (e.g., duplicate). Efficient for batches of 100.
**Alternative considered**: Individual `insertOne` per event -- rejected as unnecessarily slow.

### 3. Use Mailgun event `id` as deduplication key
**Choice**: Store Mailgun's `id` field and create a unique index on it to prevent duplicate events on re-sync.
**Rationale**: Mailgun assigns a unique ID to each event. This makes re-runs safe without needing to delete-then-reinsert. Duplicates are silently skipped via `ordered: false`.
**Alternative considered**: Delete-and-reinsert per date (like the JSONL truncate pattern) -- rejected because it risks data loss if sync fails mid-way.

### 4. Index strategy
**Choice**: Create indexes at startup via `createIndex` (idempotent):
- `{ id: 1 }` -- unique, for deduplication
- `{ "@timestamp": 1 }` -- for date range queries
- `{ event: 1, "@timestamp": 1 }` -- for filtering by event type within a date range
- `{ recipient: 1, "@timestamp": 1 }` -- for looking up events by recipient

**Rationale**: Covers the primary query patterns for email analysis. `createIndex` is a no-op if index already exists.

### 5. Sync metadata in a `syncs` collection
**Choice**: Track each sync run in a `syncs` collection with `{ date, domain, fetchedAt, eventCount }`.
**Rationale**: Replaces `metadata.json`. Useful for knowing which dates have been synced and when. Upsert by `{ date, domain }` so re-runs update the record.

## Risks / Trade-offs

- **[MongoDB connectivity]** → If the database is unreachable, sync fails immediately with a clear error. No fallback to file storage.
- **[Large bulk inserts]** → 100 docs per `insertMany` is well within MongoDB's limits (16MB batch). No risk here.
- **[Duplicate handling on re-sync]** → Unique index on `id` means re-syncing a date is safe -- duplicates are skipped, new events are inserted. This is better than the old truncate-and-rewrite approach.
- **[No local backup]** → Removing JSONL means no local copy. MongoDB Atlas provides its own backup/snapshot capabilities.
