## ADDED Requirements

### Requirement: Connect to MongoDB at startup
The system SHALL connect to MongoDB using the `MONGODB_URI` environment variable and verify connectivity before starting a sync.

#### Scenario: Successful connection
- **WHEN** the system starts with a valid `MONGODB_URI`
- **THEN** the system SHALL establish a connection to MongoDB and be ready to insert events

#### Scenario: Connection failure
- **WHEN** MongoDB is unreachable or the URI is invalid
- **THEN** the system SHALL fail with a descriptive error and exit with code 1

### Requirement: Insert events incrementally
The system SHALL insert events into a MongoDB `events` collection using `insertMany` with `ordered: false`, called once per page as events are fetched.

#### Scenario: Insert a page of events
- **WHEN** a page of 100 events is fetched from Mailgun
- **THEN** the system SHALL insert all events into the `events` collection in a single `insertMany` call

#### Scenario: Duplicate events on re-sync
- **WHEN** the system re-syncs a date and encounters events already in the collection (matching Mailgun `id`)
- **THEN** duplicate events SHALL be silently skipped and new events SHALL be inserted

### Requirement: Create indexes for query performance
The system SHALL create indexes on the `events` collection at startup to support common query patterns.

#### Scenario: Indexes created on startup
- **WHEN** the system connects to MongoDB
- **THEN** the system SHALL ensure the following indexes exist: unique on `id`, compound on `@timestamp`, compound on `event` + `@timestamp`, compound on `recipient` + `@timestamp`

### Requirement: Track sync metadata
The system SHALL record sync metadata in a `syncs` collection, upserted by date and domain.

#### Scenario: Record sync completion
- **WHEN** a sync completes for a date
- **THEN** the system SHALL upsert a document in `syncs` with `date`, `domain`, `fetchedAt`, and `eventCount`

### Requirement: Close connection on exit
The system SHALL close the MongoDB connection cleanly when the sync operation completes or the process exits.

#### Scenario: Clean shutdown after one-shot sync
- **WHEN** a one-shot sync completes
- **THEN** the system SHALL close the MongoDB client connection before exiting
