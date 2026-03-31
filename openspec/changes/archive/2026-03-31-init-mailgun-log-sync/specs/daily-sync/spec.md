## ADDED Requirements

### Requirement: One-shot CLI execution
The system SHALL support a one-shot mode that fetches events for a specified date (or yesterday by default) and exits.

#### Scenario: Fetch yesterday's events
- **WHEN** the system is run in one-shot mode without a specific date argument
- **THEN** the system SHALL fetch events for the previous calendar day (UTC) and write them to storage

#### Scenario: Fetch specific date
- **WHEN** the system is run with a `--date YYYY-MM-DD` argument
- **THEN** the system SHALL fetch events for that specific date and write them to storage

### Requirement: Daily scheduled execution
The system SHALL support a daemon mode that automatically fetches the previous day's events once per day.

#### Scenario: Daemon mode runs daily
- **WHEN** the system is started in daemon mode
- **THEN** the system SHALL schedule a daily fetch of the previous day's events, executing once per day at a configurable time (default: 02:00 UTC)

#### Scenario: Daemon mode immediate first run
- **WHEN** the system starts in daemon mode
- **THEN** the system SHALL perform an immediate fetch for yesterday's events before entering the daily schedule

### Requirement: Logging and progress output
The system SHALL output progress information during sync operations.

#### Scenario: Sync progress
- **WHEN** the system begins fetching events for a date
- **THEN** the system SHALL log the target date, number of pages fetched, total events collected, and completion status to stdout
