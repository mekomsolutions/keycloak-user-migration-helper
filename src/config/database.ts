import dotenv from "dotenv";
import { PoolOptions } from "mysql2";

dotenv.config();

const isTestEnvironment = process.env.NODE_ENV === 'test';

export const getDbConfig = (): PoolOptions => ({
  host: process.env.OPENMRS_DB_HOST,
  user: process.env.OPENMRS_DB_USER,
  password: process.env.OPENMRS_DB_PASSWORD,
  database: process.env.OPENMRS_DB_NAME,
  port: parseInt(process.env.OPENMRS_DB_PORT || "3306"),
  waitForConnections: true,
  connectionLimit: isTestEnvironment ? 1 : 10,
  queueLimit: 0,
  charset: "utf8mb4"
});

export const validateDbConfig = (): void => {
  const requiredEnvVars = ["OPENMRS_DB_HOST", "OPENMRS_DB_USER", "OPENMRS_DB_NAME"];
  const missing = requiredEnvVars.filter((var_) => !process.env[var_]);

  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
};
