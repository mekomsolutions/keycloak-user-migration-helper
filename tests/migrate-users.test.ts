import { getOutputPath } from "../src/migrate-users";

describe("Migration Utilities", () => {
  beforeEach(() => {
    // Set up test environment variables
    process.env.OUTPUT_DIR = "test-output";
    process.env.OUTPUT_FILENAME = "test-file.json";
    process.env.KEYCLOAK_REALM_ROLES = "role1,role2";
    process.env.KEYCLOAK_DEFAULT_PASSWORD = "testpass";
    process.env.SOURCE_SYSTEM = "openmrs";
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.OUTPUT_DIR;
    delete process.env.OUTPUT_FILENAME;
    delete process.env.KEYCLOAK_REALM_ROLES;
    delete process.env.KEYCLOAK_DEFAULT_PASSWORD;
    delete process.env.SOURCE_SYSTEM;
  });

  describe("getOutputPath", () => {
    it("should construct correct output path", () => {
      const result = getOutputPath();
      expect(result).toBe("test-output/test-file.json");
    });

    it("should handle different directory and filename combinations", () => {
      process.env.OUTPUT_DIR = "custom/dir";
      process.env.OUTPUT_FILENAME = "users.json";

      const result = getOutputPath();
      expect(result).toBe("custom/dir/users.json");
    });

    it("should throw error when OUTPUT_DIR is missing", () => {
      delete process.env.OUTPUT_DIR;
      expect(() => getOutputPath()).toThrow();
    });

    it("should throw error when OUTPUT_FILENAME is missing", () => {
      delete process.env.OUTPUT_FILENAME;
      expect(() => getOutputPath()).toThrow();
    });
  });
}); 