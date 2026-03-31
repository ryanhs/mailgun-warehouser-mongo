### Requirement: Authenticate with Mailgun Logs API
The system SHALL authenticate with the Mailgun Logs API (`POST /v1/analytics/logs`) using HTTP Basic Auth with the API key provided via environment configuration.

#### Scenario: Successful authentication
- **WHEN** the system sends a request with a valid API key as Basic Auth credentials
- **THEN** the Mailgun API SHALL accept the request and return log data

#### Scenario: Missing credentials
- **WHEN** the system attempts to start without a valid API key or domain
- **THEN** the system SHALL print a descriptive error and exit with a non-zero code

### Requirement: Fetch events for a date range
The system SHALL fetch all events from the Mailgun Logs API for a specified date range using RFC 2822 formatted dates.

#### Scenario: Fetch events for a single day
- **WHEN** the system requests events with start and end dates spanning a 24-hour window
- **THEN** the system SHALL return all events that occurred within that window, filtered by the configured domain

#### Scenario: No events in range
- **WHEN** the system requests events for a date range with no activity
- **THEN** the system SHALL return an empty result without error

### Requirement: Handle pagination
The system SHALL follow Mailgun's token-based pagination to retrieve all events, not just the first page (max 100 per page).

#### Scenario: Multi-page results
- **WHEN** the Mailgun API returns a response with a `pagination.next` token
- **THEN** the system SHALL send a subsequent request with that token and accumulate events across all pages

#### Scenario: End of pagination
- **WHEN** the Mailgun API returns an empty items array or no `pagination.next` token
- **THEN** the system SHALL stop paginating

### Requirement: Handle API errors gracefully
The system SHALL handle Mailgun API errors (rate limits, network failures, server errors) with appropriate retry logic.

#### Scenario: Rate limit response
- **WHEN** the Mailgun API responds with a 429 status
- **THEN** the system SHALL wait and retry the request with exponential backoff

#### Scenario: Network or server error
- **WHEN** the Mailgun API responds with a 5xx status or network timeout
- **THEN** the system SHALL retry up to 3 times with exponential backoff before failing with a descriptive error
