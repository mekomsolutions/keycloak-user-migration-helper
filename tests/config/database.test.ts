import { getDbConfig, validateDbConfig } from "../../src/config/database";

describe("OpenMRS Database Configuration", () => {
  beforeEach(() => {
    // Set up test environment variables
    process.env.OPENMRS_DB_HOST = "localhost";
    process.env.OPENMRS_DB_USER = "testuser";
    process.env.OPENMRS_DB_PASSWORD = "testpass";
    process.env.OPENMRS_DB_NAME = "testdb";
    process.env.OPENMRS_DB_PORT = "3306";
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.OPENMRS_DB_HOST;
    delete process.env.OPENMRS_DB_USER;
    delete process.env.OPENMRS_DB_PASSWORD;
    delete process.env.OPENMRS_DB_NAME;
    delete process.env.OPENMRS_DB_PORT;
    delete process.env.NODE_ENV;
  });

  it("should create OpenMRS database configuration with correct values", () => {
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
    delete process.env.OPENMRS_DB_PORT;
    const config = getDbConfig();
    expect(config.port).toBe(3306);
  });

  it("should validate OpenMRS database configuration with all required variables", () => {
    expect(() => validateDbConfig()).not.toThrow();
  });

  it("should throw error when required variables are missing", () => {
    delete process.env.OPENMRS_DB_HOST;
    expect(() => validateDbConfig()).toThrow("Missing required environment variables: OPENMRS_DB_HOST");

    delete process.env.OPENMRS_DB_USER;
    expect(() => validateDbConfig()).toThrow("Missing required environment variables: OPENMRS_DB_HOST, OPENMRS_DB_USER");

    delete process.env.OPENMRS_DB_NAME;
    expect(() => validateDbConfig()).toThrow("Missing required environment variables: OPENMRS_DB_HOST, OPENMRS_DB_USER, OPENMRS_DB_NAME");
  });
}); 