import dotenv from "dotenv";
import mysql from "mysql2/promise";
import { Pool } from "pg";
import fs from "fs/promises";
import path from "path";
import { getDbConfig, validateDbConfig } from "./config/database";
import logger from "./utils/logger";
import { KeycloakImport, KeycloakUser } from "./types/keycloak";
import { GET_USERS_QUERY as OPENMRS_GET_USERS_QUERY } from "./sources/openmrs/queries";
import { transformToKeycloakUser as transformOpenMRSUser } from "./sources/openmrs/transformer";
import { OpenMRSUser } from "./sources/openmrs/types";
import { GET_USERS_QUERY as ODOO_GET_USERS_QUERY } from "./sources/odoo/queries";
import { transformToKeycloakUser as transformOdooUser } from "./sources/odoo/transformer";
import { OdooUser } from "./sources/odoo/types";

dotenv.config();

async function validateEnvironment(): Promise<void> {
  validateDbConfig();

  const requiredEnvVars = [
    "KEYCLOAK_REALM_ROLES",
    "KEYCLOAK_DEFAULT_PASSWORD",
    "OUTPUT_DIR",
    "SOURCE_SYSTEM",
  ];

  const missing = requiredEnvVars.filter((var_) => !process.env[var_]);
  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}

async function ensureDirectoryExists(filePath: string): Promise<void> {
  const dir = path.dirname(filePath);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

export function getOutputPath(sourceSystem?: string): string {
  const outputDir = process.env.OUTPUT_DIR!;
  const filename = sourceSystem 
    ? `${sourceSystem}-users-${new Date().toISOString().split('T')[0]}.json`
    : 'keycloak-users-import.json';
  return path.join(outputDir, filename);
}

async function writeUsersToFile(users: KeycloakUser[], sourceSystem: string): Promise<void> {
  const outputPath = getOutputPath(sourceSystem);
  await ensureDirectoryExists(outputPath);
  const keycloakUsers: KeycloakImport = { users };
  await fs.writeFile(outputPath, JSON.stringify(keycloakUsers, null, 2), "utf8");
  logger.info(`Successfully wrote ${users.length} ${sourceSystem} users to ${outputPath}`);
}

async function migrateOpenMRSUsers(): Promise<KeycloakUser[]> {
  let connection;
  try {
    connection = await mysql.createPool(getDbConfig());
    logger.info("OpenMRS database connection established");

    const [rows] = await connection.execute<mysql.RowDataPacket[]>(OPENMRS_GET_USERS_QUERY);
    const users = rows as unknown as OpenMRSUser[];
    logger.info(`Retrieved ${users.length} users from OpenMRS`);

    const keycloakUsers = users.map(transformOpenMRSUser);
    logger.info(`Transformed ${users.length} OpenMRS users to Keycloak format`);

    await writeUsersToFile(keycloakUsers, 'openmrs');
    return keycloakUsers;
  } finally {
    if (connection) {
      await connection.end();
      logger.info("OpenMRS database connection closed");
    }
  }
}

async function migrateOdooUsers(): Promise<KeycloakUser[]> {
  let pool;
  try {
    pool = new Pool({
      host: process.env.ODOO_DB_HOST,
      port: parseInt(process.env.ODOO_DB_PORT || "5432"),
      user: process.env.ODOO_DB_USER,
      password: process.env.ODOO_DB_PASSWORD,
      database: process.env.ODOO_DB_NAME,
    });
    logger.info("Odoo database connection established");

    const { rows } = await pool.query<OdooUser>(ODOO_GET_USERS_QUERY);
    logger.info(`Retrieved ${rows.length} users from Odoo`);

    const keycloakUsers = rows.map(transformOdooUser);
    logger.info(`Transformed ${rows.length} Odoo users to Keycloak format`);

    await writeUsersToFile(keycloakUsers, 'odoo');
    return keycloakUsers;
  } finally {
    if (pool) {
      await pool.end();
      logger.info("Odoo database connection closed");
    }
  }
}

async function migrateUsers(): Promise<void> {
  try {
    await validateEnvironment();
    const sourceSystem = process.env.SOURCE_SYSTEM?.toLowerCase();

    let allUsers: KeycloakUser[] = [];
    switch (sourceSystem) {
      case 'openmrs':
        allUsers = await migrateOpenMRSUsers();
        break;
      case 'odoo':
        allUsers = await migrateOdooUsers();
        break;
      case 'all':
        const openmrsUsers = await migrateOpenMRSUsers();
        const odooUsers = await migrateOdooUsers();
        allUsers = [...openmrsUsers, ...odooUsers];
        break;
      default:
        throw new Error(`Unsupported source system: ${sourceSystem}`);
    }

    // Write merged file only if we have users from multiple sources
    if (sourceSystem === 'all') {
      const mergedOutput: KeycloakImport = {
        users: allUsers,
      };
      const outputPath = getOutputPath();
      await ensureDirectoryExists(outputPath);
      await fs.writeFile(outputPath, JSON.stringify(mergedOutput, null, 2), "utf8");
      logger.info(`Successfully merged ${allUsers.length} users to ${outputPath}`);
    }
  } catch (error) {
    logger.error("Error during migration:", error);
    throw error;
  }
}

// Execute migration
migrateUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error("Migration failed:", error);
    process.exit(1);
  });
