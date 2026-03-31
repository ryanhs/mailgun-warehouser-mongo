## REMOVED Requirements

### Requirement: Write events incrementally as JSONL
**Reason**: Replaced by MongoDB storage. Events are now inserted into a MongoDB `events` collection instead of written to JSONL files.
**Migration**: Query events from MongoDB instead of reading `output/YYYY-MM-DD/events.jsonl`.

### Requirement: Idempotent writes
**Reason**: Replaced by MongoDB deduplication via unique index on event `id`. Re-syncing a date safely skips duplicates instead of truncating files.
**Migration**: No action needed -- MongoDB handles deduplication automatically.

### Requirement: Write summary metadata
**Reason**: Replaced by `syncs` collection in MongoDB.
**Migration**: Query the `syncs` collection for sync metadata instead of reading `output/YYYY-MM-DD/metadata.json`.
