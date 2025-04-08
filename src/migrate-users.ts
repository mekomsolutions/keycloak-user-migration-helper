import dotenv from "dotenv";
import mysql from "mysql2/promise";
import fs from "fs/promises";
import path from "path";
import { dbConfig, validateDbConfig } from "./config/database";
import logger from "./utils/logger";
import { KeycloakImport } from "./types/keycloak";
import { GET_USERS_QUERY } from "./sources/openmrs/queries";
import { transformToKeycloakUser } from "./sources/openmrs/transformer";
import { OpenMRSUser } from "./sources/openmrs/types";

dotenv.config();

async function validateEnvironment(): Promise<void> {
  validateDbConfig();

  const requiredEnvVars = [
    "KEYCLOAK_REALM_ROLES",
    "KEYCLOAK_DEFAULT_PASSWORD",
    "KEYCLOAK_CLIENT_ID",
    "KEYCLOAK_USERS_OUTPUT_FILE",
    "SOURCE_SYSTEM"
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

async function migrateUsers(): Promise<void> {
  let connection;

  try {
    await validateEnvironment();
    logger.info(`Starting user migration from ${process.env.SOURCE_SYSTEM}`);

    connection = await mysql.createPool(dbConfig);
    logger.info("Database connection established");

    const [rows] = await connection.execute<mysql.RowDataPacket[]>(GET_USERS_QUERY);
    const users = rows as unknown as OpenMRSUser[];
    logger.info(`Retrieved ${users.length} users from ${process.env.SOURCE_SYSTEM}`);

    const keycloakUsers: KeycloakImport = {
      users: users.map(transformToKeycloakUser)
    };

    const outputFile = process.env.KEYCLOAK_USERS_OUTPUT_FILE!;
    await ensureDirectoryExists(outputFile);
    
    await fs.writeFile(
      outputFile,
      JSON.stringify(keycloakUsers, null, 2),
      "utf8"
    );

    logger.info(`Successfully migrated ${users.length} users to ${outputFile}`);
  } catch (error) {
    logger.error("Error during migration:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      logger.info("Database connection closed");
    }
  }
}

// Execute migration
migrateUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error("Migration failed:", error);
    process.exit(1);
  });
