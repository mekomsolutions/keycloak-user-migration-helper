import dotenv from "dotenv";
import mysql from "mysql2/promise";
import { Pool } from "pg";
import fs from "fs/promises";
import path from "path";
import { getDbConfig, validateDbConfig } from "./config/database";
import logger from "./utils/logger";
import { KeycloakImport } from "./types/keycloak";
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

export function getOutputPath(sourceSystem: string): string {
  const outputDir = process.env.OUTPUT_DIR!;
  const filename = `${sourceSystem}-users-${new Date().toISOString().split("T")[0]}.json`;
  return path.join(outputDir, filename);
}

async function migrateOpenMRSUsers(): Promise<number> {
  let connection;
  try {
    connection = await mysql.createPool(getDbConfig());
    logger.info("OpenMRS database connection established");

    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      OPENMRS_GET_USERS_QUERY
    );
    const users = rows as unknown as OpenMRSUser[];
    logger.info(`Retrieved ${users.length} users from OpenMRS`);

    const keycloakUsers: KeycloakImport = {
      users: users.map(transformOpenMRSUser),
    };

    const outputPath = getOutputPath("openmrs");
    await ensureDirectoryExists(outputPath);
    await fs.writeFile(
      outputPath,
      JSON.stringify(keycloakUsers, null, 2),
      "utf8"
    );
    logger.info(
      `Successfully migrated ${users.length} OpenMRS users to ${outputPath}`
    );

    return users.length;
  } finally {
    if (connection) {
      await connection.end();
      logger.info("OpenMRS database connection closed");
    }
  }
}

async function migrateOdooUsers(): Promise<number> {
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

    const keycloakUsers: KeycloakImport = {
      users: rows.map(transformOdooUser),
    };

    const outputPath = getOutputPath("odoo");
    await ensureDirectoryExists(outputPath);
    await fs.writeFile(
      outputPath,
      JSON.stringify(keycloakUsers, null, 2),
      "utf8"
    );
    logger.info(
      `Successfully migrated ${rows.length} Odoo users to ${outputPath}`
    );

    return rows.length;
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

    let migratedCount = 0;
    switch (sourceSystem) {
      case "openmrs":
        migratedCount = await migrateOpenMRSUsers();
        break;
      case "odoo":
        migratedCount = await migrateOdooUsers();
        break;
      case "all":
        const openmrsCount = await migrateOpenMRSUsers();
        const odooCount = await migrateOdooUsers();
        migratedCount = openmrsCount + odooCount;
        break;
      default:
        throw new Error(`Unsupported source system: ${sourceSystem}`);
    }

    logger.info(`Total users migrated: ${migratedCount}`);
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
