## Why

Mailgun retains event logs for a limited period (depending on the plan, typically 1-30 days). Once expired, these logs are permanently lost. We need a local warehousing solution that syncs Mailgun event logs on a daily schedule into persistent storage, enabling long-term email delivery analysis, troubleshooting, and auditing.

## What Changes

- Initialize the project with a Mailgun log fetching module that pulls events via the Mailgun Logs API (`POST /v1/analytics/logs`)
- Store fetched logs as JSONL files in an `output/` directory, organized by date, written incrementally per page
- Implement a daily sync schedule that fetches the previous day's events
- Configure environment variables for Mailgun API credentials and domain settings
- Provide a CLI entry point to run the sync manually or on schedule

## Capabilities

### New Capabilities
- `mailgun-event-fetch`: Core capability to authenticate with Mailgun Logs API via direct HTTP and fetch event logs with token-based pagination
- `log-storage`: Write fetched event logs incrementally as JSONL files to the `output/` directory, organized by date
- `daily-sync`: Orchestrate daily scheduled fetching of the previous day's Mailgun events
- `config`: Environment-based configuration for Mailgun API key, domain, and storage settings

### Modified Capabilities
<!-- None - this is a greenfield project -->

## Impact

- **New files**: Source files in `src/` implementing fetch, storage, and scheduling logic
- **Dependencies**: Uses `luxon` and `dotenv` packages; calls Mailgun API directly via `fetch()` (no SDK dependency at runtime)
- **Environment**: Requires `MAILGUN_API_KEY` and `MAILGUN_DOMAIN` in `.env`
- **Output**: Creates `output/` directory with date-organized JSONL log files and metadata
- **No database required for initial implementation** - files stored locally as JSON for simplicity
