### Requirement: Environment-based configuration
The system SHALL load configuration from environment variables via a `.env` file using the `dotenv` package.

#### Scenario: Load configuration from .env
- **WHEN** the system starts
- **THEN** the system SHALL read `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, and `MONGODB_URI` from environment variables

#### Scenario: Missing MONGODB_URI
- **WHEN** `MONGODB_URI` is not set
- **THEN** the system SHALL print a clear error message and exit with code 1

### Requirement: Validate required configuration
The system SHALL validate that all required configuration values are present at startup.

#### Scenario: Missing required variable
- **WHEN** `MAILGUN_API_KEY` or `MAILGUN_DOMAIN` is not set
- **THEN** the system SHALL print a clear error message identifying the missing variable and exit with code 1

### Requirement: Configuration for Mailgun region
The system SHALL support configuring the Mailgun API region (US or EU).

#### Scenario: EU region configuration
- **WHEN** `MAILGUN_REGION` is set to `eu`
- **THEN** the system SHALL use the EU Mailgun API endpoint (`https://api.eu.mailgun.net`)

#### Scenario: Default US region
- **WHEN** `MAILGUN_REGION` is not set or set to `us`
- **THEN** the system SHALL use the default US Mailgun API endpoint
