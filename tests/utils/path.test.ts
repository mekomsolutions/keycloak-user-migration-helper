import { getOutputPath } from "../../src/migrate-users";

describe("Path Utilities", () => {
  beforeEach(() => {
    process.env.OUTPUT_DIR = "test-output";
    process.env.OUTPUT_FILENAME = "test-file.json";
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.OUTPUT_DIR;
    delete process.env.OUTPUT_FILENAME;
  });

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
});
