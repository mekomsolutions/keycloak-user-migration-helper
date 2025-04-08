import { getDbConfig, validateDbConfig } from "../../src/config/database";

describe("Database Configuration", () => {
  beforeEach(() => {
    // Set up test environment variables
    process.env.DB_HOST = "localhost";
    process.env.DB_USER = "testuser";
    process.env.DB_PASSWORD = "testpass";
    process.env.DB_NAME = "testdb";
    process.env.DB_PORT = "3306";
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.DB_HOST;
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_NAME;
    delete process.env.DB_PORT;
  });

  it("should create database configuration with correct values", () => {
    const config = getDbConfig();
    expect(config.host).toBe("localhost");
    expect(config.user).toBe("testuser");
    expect(config.password).toBe("testpass");
    expect(config.database).toBe("testdb");
    expect(config.port).toBe(3306);
    expect(config.charset).toBe("utf8mb4");
    expect(config.connectionLimit).toBe(1); // Should be 1 in test environment
  });

  it("should use default port when not specified", () => {
    delete process.env.DB_PORT;
    const config = getDbConfig();
    expect(config.port).toBe(3306);
  });

  it("should validate configuration with all required variables", () => {
    expect(() => validateDbConfig()).not.toThrow();
  });

  it("should throw error when required variables are missing", () => {
    delete process.env.DB_HOST;
    expect(() => validateDbConfig()).toThrow("Missing required environment variables: DB_HOST");

    delete process.env.DB_USER;
    expect(() => validateDbConfig()).toThrow("Missing required environment variables: DB_HOST, DB_USER");

    delete process.env.DB_NAME;
    expect(() => validateDbConfig()).toThrow("Missing required environment variables: DB_HOST, DB_USER, DB_NAME");
  });
}); 