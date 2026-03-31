## ADDED Requirements

### Requirement: Write events incrementally as JSONL
The system SHALL write fetched events to JSONL files (one JSON object per line) in the `output/` directory, organized by date. Events SHALL be appended to disk as each page is fetched.

#### Scenario: Store events for a date
- **WHEN** the system fetches a page of events for date `2024-01-15`
- **THEN** the system SHALL append each event as a JSON line to `output/2024-01-15/events.jsonl`

#### Scenario: Output directory does not exist
- **WHEN** the system writes events and the `output/` directory or date subdirectory does not exist
- **THEN** the system SHALL create the necessary directories recursively before writing

### Requirement: Idempotent writes
The system SHALL support re-running for the same date by truncating the events file before fetching begins.

#### Scenario: Re-fetch for existing date
- **WHEN** the system begins a sync for a date that already has an `output/YYYY-MM-DD/events.jsonl` file
- **THEN** the system SHALL truncate the existing file before writing new events

### Requirement: Write summary metadata
The system SHALL include a metadata summary alongside the events to aid analysis.

#### Scenario: Metadata in output
- **WHEN** all events have been fetched and written for a date
- **THEN** the system SHALL write `output/YYYY-MM-DD/metadata.json` containing: fetch timestamp, event count, date range, and domain name
