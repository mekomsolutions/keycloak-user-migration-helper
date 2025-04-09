import { getOutputPath } from "../../src/migrate-users";

describe("Path Utilities", () => {
  beforeEach(() => {
    process.env.OUTPUT_DIR = "test-output";
    process.env.SOURCE_SYSTEM = "all";
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.OUTPUT_DIR;
    delete process.env.SOURCE_SYSTEM;
  });

  it("should construct correct output path", () => {
    const result = getOutputPath();
    expect(result).toBe("test-output/keycloak-users-import.json");
  });

  it("should handle different directory and filename combinations", () => {
    process.env.OUTPUT_DIR = "custom/dir";
    process.env.SOURCE_SYSTEM = "openmrs";

    const result = getOutputPath();
    expect(result).toBe("custom/dir/keycloak-users-import.json");
  });
});
