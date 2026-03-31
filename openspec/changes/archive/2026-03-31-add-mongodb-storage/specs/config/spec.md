## MODIFIED Requirements

### Requirement: Environment-based configuration
The system SHALL load configuration from environment variables via a `.env` file using the `dotenv` package.

#### Scenario: Load configuration from .env
- **WHEN** the system starts
- **THEN** the system SHALL read `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, and `MONGODB_URI` from environment variables

#### Scenario: Missing MONGODB_URI
- **WHEN** `MONGODB_URI` is not set
- **THEN** the system SHALL print a clear error message and exit with code 1

## REMOVED Requirements

### Requirement: Default output directory
**Reason**: File-based storage is replaced by MongoDB. The `OUTPUT_DIR` variable and `output/` directory are no longer used.
**Migration**: Configure `MONGODB_URI` instead. Existing JSONL files in `output/` remain on disk but are no longer written to.
