import dotenv from "dotenv";
import { PoolOptions } from "mysql2";

dotenv.config();

export const dbConfig: PoolOptions = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || "3306"),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

export const validateDbConfig = (): void => {
  const requiredEnvVars = ["DB_HOST", "DB_USER", "DB_NAME"];
  const missing = requiredEnvVars.filter((var_) => !process.env[var_]);

  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
};
