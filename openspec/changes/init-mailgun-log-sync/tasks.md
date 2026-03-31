## 1. Configuration

- [x] 1.1 Create `src/config.ts` - load and validate environment variables (MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_REGION, OUTPUT_DIR) using dotenv, with defaults and clear error messages for missing required values
- [x] 1.2 Update `.env.example` with all required and optional environment variables with descriptions

## 2. Mailgun Client

- [x] 2.1 Create `src/mailgun-client.ts` - direct HTTP calls to Mailgun Logs API (`POST /v1/analytics/logs`) with Basic Auth and US/EU region support
- [x] 2.2 Implement `fetchEvents(config, begin, end, onPage)` that fetches all events for a date range with token-based pagination (100 per page), calling `onPage` callback for each page to enable incremental writes
- [x] 2.3 Add retry logic with exponential backoff for 429 rate limits and 5xx server errors (max 3 retries)

## 3. Log Storage

- [x] 3.1 Create `src/storage.ts` - implement `initEventsFile()` and `appendEvents()` for incremental JSONL writes to `output/YYYY-MM-DD/events.jsonl`, creating directories recursively
- [x] 3.2 Implement `writeMetadata(date, metadata)` that writes `output/YYYY-MM-DD/metadata.json` with fetch timestamp, event count, date range, and domain

## 4. Daily Sync Orchestration

- [x] 4.1 Create `src/sync.ts` - implement `syncDate(config, date)` that orchestrates fetching events and writing to storage incrementally with progress logging to stdout
- [x] 4.2 Implement one-shot mode: fetch for a specific date (via `--date YYYY-MM-DD` arg) or default to yesterday (UTC)

## 5. Entry Point and CLI

- [x] 5.1 Create `src/index.ts` - CLI entry point that parses args (`--date`, `--daemon`), loads config, and runs the appropriate mode
- [x] 5.2 Add `start` and `sync` scripts to `package.json` for running the application
- [x] 5.3 Add `output/` to `.gitignore`

## 6. Daemon Mode

- [x] 6.1 Implement daemon mode in `src/index.ts` that runs an immediate sync on startup, then schedules daily execution at a configurable time (default 02:00 UTC)
