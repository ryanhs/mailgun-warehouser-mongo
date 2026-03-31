### Requirement: One-shot CLI execution
The system SHALL support a one-shot mode that fetches events for a specified date (or yesterday by default) and exits.

#### Scenario: Fetch yesterday's events
- **WHEN** the system is run without a specific date argument
- **THEN** the system SHALL fetch events for the previous calendar day (UTC) and store them

#### Scenario: Fetch specific date
- **WHEN** the system is run with a `--date YYYY-MM-DD` argument
- **THEN** the system SHALL fetch events for that specific date and store them

### Requirement: Logging and progress output
The system SHALL output progress information during sync operations.

#### Scenario: Sync progress
- **WHEN** the system begins fetching events for a date
- **THEN** the system SHALL log the target date, number of pages fetched, total events collected, and completion status to stdout
