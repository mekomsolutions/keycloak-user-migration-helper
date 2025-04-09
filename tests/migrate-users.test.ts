import { getOutputPath, validateEnvironment, migrateUsers } from "../src/migrate-users";
import { KeycloakUser } from "../src/types/keycloak";
import mysql from "mysql2/promise";
import { Pool } from "pg";
import fs from "fs/promises";
import path from "path";

// Mock the dependencies
jest.mock("mysql2/promise");
jest.mock("pg");
jest.mock("fs/promises");
jest.mock("../src/config/database");
jest.mock("../src/sources/openmrs/transformer");
jest.mock("../src/sources/odoo/transformer");
jest.mock("../src/utils/logger");

describe("Migration Utilities", () => {
  const mockOpenMRSUser = {
    uuid: "test-uuid",
    user_id: 1,
    username: "testuser",
    given_name: "Test",
    family_name: "User",
    email: "test@example.com",
  };

  const mockOdooUser = {
    id: 1,
    login: "testuser",
    name: "Test User",
    email: "test@example.com",
  };

  beforeEach(() => {
    // Set up test environment variables
    process.env.OUTPUT_DIR = "test-output";
    process.env.KEYCLOAK_REALM_ROLES = JSON.stringify(["role1", "role2"]);
    process.env.KEYCLOAK_DEFAULT_PASSWORD = "testpass";
    process.env.SOURCE_SYSTEM = "all";
    process.env.OPENMRS_DB_HOST = "localhost";
    process.env.OPENMRS_DB_USER = "testuser";
    process.env.OPENMRS_DB_PASSWORD = "testpass";
    process.env.OPENMRS_DB_NAME = "testdb";
    process.env.ODOO_DB_HOST = "localhost";
    process.env.ODOO_DB_USER = "testuser";
    process.env.ODOO_DB_PASSWORD = "testpass";
    process.env.ODOO_DB_NAME = "testdb";
    process.env.ODOO_DB_PORT = "5432";

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.OUTPUT_DIR;
    delete process.env.KEYCLOAK_REALM_ROLES;
    delete process.env.KEYCLOAK_DEFAULT_PASSWORD;
    delete process.env.SOURCE_SYSTEM;
    delete process.env.OPENMRS_DB_HOST;
    delete process.env.OPENMRS_DB_USER;
    delete process.env.OPENMRS_DB_PASSWORD;
    delete process.env.OPENMRS_DB_NAME;
    delete process.env.ODOO_DB_HOST;
    delete process.env.ODOO_DB_USER;
    delete process.env.ODOO_DB_PASSWORD;
    delete process.env.ODOO_DB_NAME;
    delete process.env.ODOO_DB_PORT;
  });

  describe("getOutputPath", () => {
    it("should construct correct output path for default filename", () => {
      const result = getOutputPath();
      expect(result).toBe("test-output/keycloak-users-import.json");
    });

    it("should construct correct output path with source system", () => {
      const today = new Date().toISOString().split('T')[0];
      const result = getOutputPath("openmrs");
      expect(result).toBe(`test-output/openmrs-users-${today}.json`);
    });

    it("should handle different directory paths", () => {
      process.env.OUTPUT_DIR = "custom/dir";
      const result = getOutputPath();
      expect(result).toBe("custom/dir/keycloak-users-import.json");
    });

    it("should throw error when OUTPUT_DIR is missing", () => {
      delete process.env.OUTPUT_DIR;
      expect(() => getOutputPath()).toThrow();
    });
  });

  describe("validateEnvironment", () => {
    it("should not throw when all required variables are present", async () => {
      await expect(validateEnvironment()).resolves.not.toThrow();
    });

    it("should throw when KEYCLOAK_REALM_ROLES is missing", async () => {
      delete process.env.KEYCLOAK_REALM_ROLES;
      await expect(validateEnvironment()).rejects.toThrow("Missing required environment variables: KEYCLOAK_REALM_ROLES");
    });

    it("should throw when KEYCLOAK_DEFAULT_PASSWORD is missing", async () => {
      delete process.env.KEYCLOAK_DEFAULT_PASSWORD;
      await expect(validateEnvironment()).rejects.toThrow("Missing required environment variables: KEYCLOAK_DEFAULT_PASSWORD");
    });

    it("should throw when OUTPUT_DIR is missing", async () => {
      delete process.env.OUTPUT_DIR;
      await expect(validateEnvironment()).rejects.toThrow("Missing required environment variables: OUTPUT_DIR");
    });

    it("should throw when SOURCE_SYSTEM is missing", async () => {
      delete process.env.SOURCE_SYSTEM;
      await expect(validateEnvironment()).rejects.toThrow("Missing required environment variables: SOURCE_SYSTEM");
    });
  });

  describe("migrateUsers", () => {
    beforeEach(() => {
      // Mock database connections
      (mysql.createPool as jest.Mock).mockResolvedValue({
        execute: jest.fn().mockResolvedValue([[mockOpenMRSUser]]),
        end: jest.fn(),
      });

      (Pool as unknown as jest.Mock).mockImplementation(() => ({
        query: jest.fn().mockResolvedValue({ rows: [mockOdooUser] }),
        end: jest.fn(),
      }));

      // Mock file system operations
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    });

    it("should migrate OpenMRS users when SOURCE_SYSTEM is 'openmrs'", async () => {
      process.env.SOURCE_SYSTEM = "openmrs";
      await migrateUsers();
      expect(mysql.createPool).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining("openmrs-users-"),
        expect.any(String),
        "utf8"
      );
    });

    it("should migrate Odoo users when SOURCE_SYSTEM is 'odoo'", async () => {
      process.env.SOURCE_SYSTEM = "odoo";
      await migrateUsers();
      expect(Pool).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining("odoo-users-"),
        expect.any(String),
        "utf8"
      );
    });

    it("should migrate both OpenMRS and Odoo users when SOURCE_SYSTEM is 'all'", async () => {
      process.env.SOURCE_SYSTEM = "all";
      await migrateUsers();
      expect(mysql.createPool).toHaveBeenCalled();
      expect(Pool).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledTimes(3); // Once for each source and once for merged
    });

    it("should throw error for unsupported source system", async () => {
      process.env.SOURCE_SYSTEM = "invalid";
      await expect(migrateUsers()).rejects.toThrow("Unsupported source system: invalid");
    });

    it("should handle database connection errors", async () => {
      process.env.SOURCE_SYSTEM = "openmrs";
      (mysql.createPool as jest.Mock).mockRejectedValue(new Error("Connection failed"));
      await expect(migrateUsers()).rejects.toThrow("Connection failed");
    });

    it("should handle file system errors", async () => {
      process.env.SOURCE_SYSTEM = "openmrs";
      (fs.writeFile as jest.Mock).mockRejectedValue(new Error("Write failed"));
      await expect(migrateUsers()).rejects.toThrow("Write failed");
    });
  });
}); 