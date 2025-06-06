# Keycloak User Migration Helper

A simple tool to extract users from OpenMRS and Odoo systems and generate JSON files for Keycloak bulk import.

> **Note**: This is a quick implementation for a specific use case. There might be better, more comprehensive tools available for user migration to Keycloak.

## Migration Strategies

Keycloak offers two main approaches for user migration:

1. **User Federation**: Connects Keycloak to existing user stores (like LDAP or databases). Users remain in the original system while Keycloak handles authentication.

2. **User Import**: Transfers all users and their credentials directly into Keycloak's database. This is ideal when retiring the legacy system.

This tool implements the **User Import** strategy, providing a streamlined way to migrate users from OpenMRS and Odoo into Keycloak.

## What it does

- Extracts users from OpenMRS (MySQL) and Odoo (PostgreSQL)
- Generates Keycloak-compatible JSON files
- Can merge users from multiple sources into a single file

## Quick Start

1. Copy and edit the environment file:

```bash
cp .env.example .env
```

2. Run the migration using the pre-built image:

```bash
# If your databases are on the host machine
docker run --network host \
  -v $(pwd)/output:/app/output \
  -v $(pwd)/logs:/app/logs \
  --env-file .env \
  mekomsolutions/keycloak-user-migration-helper:latest

# If your databases are in Docker containers
docker run --network your_database_network \
  -v $(pwd)/output:/app/output \
  -v $(pwd)/logs:/app/logs \
  --env-file .env \
  mekomsolutions/keycloak-user-migration-helper:latest
```

## Building Locally

For development or custom builds:

1. Clone the repository:

```bash
git clone https://github.com/mekomsolutions/keycloak-user-migration-helper.git
cd keycloak-user-migration-helper
```

2. Build the Docker image:

```bash
docker build -t keycloak-user-migration-helper .
```

3. Run using the locally built image:

```bash
docker run --network host \
  -v $(pwd)/output:/app/output \
  -v $(pwd)/logs:/app/logs \
  --env-file .env \
  keycloak-user-migration-helper
```

Or use docker-compose:

```bash
docker-compose up
```

## Configuration

Basic `.env` setup:

```env
# OpenMRS database configuration
OPENMRS_DB_HOST=localhost
OPENMRS_DB_PORT=3306
OPENMRS_DB_USER=root
OPENMRS_DB_PASSWORD=password
OPENMRS_DB_NAME=openmrs

# Odoo database configuration
ODOO_DB_HOST=localhost
ODOO_DB_USER=odoo
ODOO_DB_PASSWORD=password
ODOO_DB_NAME=odoo
ODOO_DB_PORT=5432

# Keycloak settings
KEYCLOAK_REALM_ROLES=["default-roles-ozone"]
KEYCLOAK_DEFAULT_PASSWORD=ChangeMe123!

# Migration options
OUTPUT_DIR=./output
SOURCE_SYSTEM=all # openmrs, odoo, or all
```

## Output Files

The tool creates:

- Individual source files: `openmrs-users-YYYY-MM-DD.json`, `odoo-users-YYYY-MM-DD.json`
- Combined file (when using `SOURCE_SYSTEM=all`): `keycloak-users-import.json`

Import these files via Keycloak Admin UI: Realm Settings → Actions → Partial Import → Upload JSON file.

> Detailed explaination of bulk users import here: https://docs.expertflow.com/cx/4.6/admin-guide-for-bulk-user-upload-to-keycloak