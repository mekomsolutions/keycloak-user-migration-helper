import dotenv from "dotenv";
import { PoolOptions } from "mysql2";

dotenv.config();

const isTestEnvironment = process.env.NODE_ENV === 'test';

export const getDbConfig = (): PoolOptions => ({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || "3306"),
  waitForConnections: true,
  connectionLimit: isTestEnvironment ? 1 : 10,
  queueLimit: 0,
  charset: "utf8mb4"
});

export const validateDbConfig = (): void => {
  const requiredEnvVars = ["DB_HOST", "DB_USER", "DB_NAME"];
  const missing = requiredEnvVars.filter((var_) => !process.env[var_]);

  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
};
