## 1. Configuration

- [x] 1.1 Update `src/config.ts` - add `MONGODB_URI` as required env var, remove `OUTPUT_DIR` and `outputDir` from Config interface
- [x] 1.2 Update `.env.example` - add `MONGODB_URI`, remove `OUTPUT_DIR`

## 2. MongoDB Storage Module

- [x] 2.1 Create `src/mongodb.ts` - connect to MongoDB using the `mongodb` driver, export `getDb()`, `getEventsCollection()`, `getSyncsCollection()`, and `closeDb()`
- [x] 2.2 Implement `ensureIndexes()` that creates indexes on the `events` collection: unique on `id`, compound on `@timestamp`, compound on `event` + `@timestamp`, compound on `recipient` + `@timestamp`
- [x] 2.3 Implement `insertEvents(events: object[])` using `insertMany` with `ordered: false` to silently skip duplicates
- [x] 2.4 Implement `upsertSync(date, domain, eventCount)` that upserts a document in the `syncs` collection by `{ date, domain }`

## 3. Remove File Storage

- [x] 3.1 Delete `src/storage.ts` entirely (JSONL and metadata file writing)
- [x] 3.2 Remove `output/` from `.gitignore` (no longer relevant)

## 4. Update Sync Orchestration

- [x] 4.1 Update `src/sync.ts` - replace file storage calls with MongoDB inserts: use `insertEvents()` in the `onPage` callback, call `upsertSync()` on completion
- [x] 4.2 Update `src/sync.ts` - connect to MongoDB at start of sync, ensure indexes, close connection when done

## 5. Entry Point Updates

- [x] 5.1 Update `src/index.ts` - ensure MongoDB connection is closed on exit in both one-shot and daemon modes
- [x] 5.2 Update `README.md` - document MongoDB setup, remove JSONL/output references, update env vars table
