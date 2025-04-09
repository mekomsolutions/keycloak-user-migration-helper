# User Migration to Keycloak

This document provides guidance on migrating users from legacy systems (OpenMRS and Odoo) to Keycloak.

## Migration Strategies

Keycloak provides two main approaches for bringing users from legacy systems:

### 1. User Federation
User Federation allows Keycloak to connect directly to an external user store (like LDAP or a custom database). In this approach:
- User information remains in the legacy system
- Authentication is handled by Keycloak
- Periodic syncs can be configured to gradually migrate user data
- Best for scenarios where the legacy system will remain active

### 2. User Import
User Import involves copying all users and their credentials directly into Keycloak's internal database. This approach:
- Transfers all user data to Keycloak
- Allows complete retirement of the legacy system
- Provides better performance as all data is local
- Best for scenarios where the legacy system is being decommissioned

## Using This Migration Tool

This tool supports the User Import strategy, allowing you to:
1. Extract users from OpenMRS and/or Odoo
2. Transform user data into Keycloak's format
3. Generate import files for Keycloak

### Configuration

Create a `.env` file with the following variables:

```bash
# Required for all migrations
OUTPUT_DIR=/path/to/output
KEYCLOAK_REALM_ROLES='["role1", "role2"]'
KEYCLOAK_DEFAULT_PASSWORD=default-password
SOURCE_SYSTEM=all  # Options: 'openmrs', 'odoo', 'all'

# OpenMRS Database Configuration
OPENMRS_DB_HOST=localhost
OPENMRS_DB_USER=username
OPENMRS_DB_PASSWORD=password
OPENMRS_DB_NAME=database_name
OPENMRS_DB_PORT=3306

# Odoo Database Configuration
ODOO_DB_HOST=localhost
ODOO_DB_USER=username
ODOO_DB_PASSWORD=password
ODOO_DB_NAME=database_name
ODOO_DB_PORT=5432
```

### Running the Migration with Docker

You can use either a pre-built image or build your own:

#### Option 1: Using Pre-built Image (Recommended)

1. Pull the latest image:
```bash
docker pull ghcr.io/mekomsolutions/keycloak-user-migration-helper:latest
```

2. Run the migration container:
```bash
docker run --rm \
  --env-file .env \
  -v $(pwd)/output:/app/output \
  ghcr.io/mekomsolutions/keycloak-user-migration-helper:latest
```

#### Option 2: Building Your Own Image

1. Build the Docker image:
```bash
docker build -t keycloak-user-migration .
```

2. Run the migration container:
```bash
docker run --rm \
  --env-file .env \
  -v $(pwd)/output:/app/output \
  keycloak-user-migration
```

The container will:
- Mount the output directory to persist generated files
- Use environment variables from your .env file
- Run the migration process
- Exit automatically when complete


### Output Files

The tool generates the following files:
- `openmrs-users-{date}.json`: OpenMRS users (if SOURCE_SYSTEM includes 'openmrs')
- `odoo-users-{date}.json`: Odoo users (if SOURCE_SYSTEM includes 'odoo')
- `keycloak-users-import.json`: Combined users (if SOURCE_SYSTEM is 'all')

### Importing to Keycloak

1. Log in to the Keycloak Admin Console
2. Navigate to the target realm
3. Go to Realm Settings → Actions → Partial Import
4. Select the generated JSON file
5. Click Import

## Best Practices

1. **Test First**: Always test the migration in a non-production environment first
2. **Backup**: Take backups of both source systems and Keycloak before migration
3. **Validate**: Verify the imported users and their attributes in Keycloak
4. **Plan Rollback**: Have a rollback plan in case of issues
5. **Monitor**: Monitor the system after migration for any authentication issues

## Troubleshooting

Common issues and solutions:

1. **Database Connection Errors**
   - Verify database credentials
   - Check network connectivity
   - Ensure database is accessible
   - For Docker: Ensure the container can reach the database host

2. **Missing Environment Variables**
   - Check all required variables are set in .env file
   - Verify variable names are correct
   - Ensure values are properly formatted

3. **Import Failures in Keycloak**
   - Check JSON file format
   - Verify required fields are present

4. **Docker-Specific Issues**
   - Ensure the output directory is writable
   - Check Docker network configuration if databases are in containers
   - Verify volume mounts are working correctly
   - For pre-built images: Ensure you have the latest version
   - Check Docker Hub/GitHub Container Registry access if using pre-built images
