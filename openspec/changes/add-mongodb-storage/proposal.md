## Why

JSONL files work for basic warehousing but are difficult to query, filter, and aggregate. MongoDB is already a project dependency and the production URI is available. Moving storage to MongoDB enables querying events by type, recipient, date range, and other fields -- making the warehoused data actually useful for analysis.

## What Changes

- **BREAKING**: Replace JSONL file storage with MongoDB as the sole storage backend
- Add `MONGODB_URI` to configuration and validate at startup
- Store events in a MongoDB collection with proper indexing for common query patterns
- Store sync metadata in a separate collection to track what dates have been synced
- Remove JSONL file writing and `output/` directory logic
- Remove `OUTPUT_DIR` environment variable

## Capabilities

### New Capabilities
- `mongodb-storage`: Connect to MongoDB, insert events incrementally per page, store sync metadata, with proper indexes for querying by date, event type, and recipient

### Modified Capabilities
- `config`: Add `MONGODB_URI` as required, remove `OUTPUT_DIR`
- `log-storage`: Replace JSONL file writes with MongoDB inserts (same incremental-per-page pattern)

## Impact

- **Modified files**: `src/config.ts`, `src/storage.ts`, `src/sync.ts`
- **Dependencies**: Uses existing `mongodb` package (already installed)
- **Environment**: Requires new `MONGODB_URI` variable; removes `OUTPUT_DIR`
- **Data**: Existing JSONL files in `output/` are unaffected but no longer written to
- **Breaking**: Anyone relying on `output/` directory for log files will need to query MongoDB instead
