import dotenv from "dotenv";
import mysql from "mysql2/promise";
import fs from "fs/promises";
import { dbConfig, validateDbConfig } from "./config/database";
import logger from "./utils/logger";
import { OpenMRSUser, KeycloakUser, KeycloakImport } from "./types/user";

dotenv.config();

const QUERY = `
  SELECT 
    u.uuid,
    u.user_id,
    u.username,
    pn.given_name,
    pn.middle_name,
    pn.family_name,
    u.email
  FROM
    users u
    LEFT JOIN person_name pn ON (u.person_id = pn.person_id)
  WHERE
    u.retired = 0 AND pn.voided = 0 AND pn.preferred = 1;
`;

async function validateEnvironment(): Promise<void> {
  validateDbConfig();

  const requiredEnvVars = [
    "KEYCLOAK_REALM_ROLES",
    "KEYCLOAK_DEFAULT_PASSWORD",
    "KEYCLOAK_CLIENT_ID",
    "OUTPUT_FILE",
  ];

  const missing = requiredEnvVars.filter((var_) => !process.env[var_]);
  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}

function transformToKeycloakUser(user: OpenMRSUser): KeycloakUser {
  return {
    username: user.username,
    firstName: user.given_name || "",
    lastName: user.family_name || "",
    email: user.email || `${user.username}@example.com`,
    enabled: true,
    emailVerified: false,
    createdTimestamp: Date.now(),
    totp: false,
    credentials: [
      {
        type: "password",
        value: process.env.KEYCLOAK_DEFAULT_PASSWORD!,
      },
    ],
    attributes: {
      provider: "true",
      openmrs_uuid: user.uuid,
    },
    disableableCredentialTypes: [],
    requiredActions: ["UPDATE_PASSWORD"],
    realmRoles: process.env.KEYCLOAK_REALM_ROLES!.split(","),
    clientRoles: {
      [process.env.KEYCLOAK_CLIENT_ID!]: [],
    },
    notBefore: 0,
    groups: [],
  };
}

async function migrateUsers(): Promise<void> {
  let connection;

  try {
    await validateEnvironment();
    logger.info("Starting user migration");

    connection = await mysql.createPool(dbConfig);
    logger.info("Database connection established");

    const [rows] = await connection.execute<mysql.RowDataPacket[]>(QUERY);
    const users = rows as unknown as OpenMRSUser[];
    logger.info(`Retrieved ${users.length} users from OpenMRS`);

    const keycloakUsers: KeycloakImport = {
      users: users.map(transformToKeycloakUser),
    };

    await fs.writeFile(
      process.env.OUTPUT_FILE!,
      JSON.stringify(keycloakUsers, null, 2),
      "utf8"
    );

    logger.info(
      `Successfully migrated ${users.length} users to ${process.env.OUTPUT_FILE}`
    );
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
