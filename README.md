# Keycloak User Migration Helper

A simple tool to extract users from OpenMRS and Odoo systems and generate JSON files for Keycloak bulk import.

> **Note**: This is a quick implementation for a specific use case. There might be better, more comprehensive tools available for user migration to Keycloak.

## What it does

- Extracts users from OpenMRS (MySQL) and Odoo (PostgreSQL)
- Generates Keycloak-compatible JSON files
- Can merge users from multiple sources into a single file

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Copy and edit the environment file:
```bash
cp .env.example .env
```

3. Run the migration:
```bash
npm start
```

## Docker

### Using the pre-built image

```bash
docker run -v $(pwd)/output:/app/output -v $(pwd)/logs:/app/logs --env-file .env ghcr.io/mekomsolutions/keycloak-user-migration-helper:latest
```

### Building locally

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
