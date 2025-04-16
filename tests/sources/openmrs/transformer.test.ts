import { transformToKeycloakUser } from "../../../src/sources/openmrs/transformer";
import { OpenMRSUser } from "../../../src/sources/openmrs/types";

describe("OpenMRS Transformer", () => {
  const mockUser: OpenMRSUser = {
    uuid: "test-uuid",
    user_id: 1,
    username: "testuser",
    given_name: "Test",
    middle_name: "Middle",
    family_name: "User",
    email: "test@example.com",
  };

  beforeEach(() => {
    process.env.KEYCLOAK_DEFAULT_PASSWORD = "test-password";
    process.env.KEYCLOAK_REALM_ROLES = JSON.stringify(["default-role"]);
    process.env.KEYCLOAK_CLIENT_ID = "test-client";
  });

  afterEach(() => {
    delete process.env.KEYCLOAK_DEFAULT_PASSWORD;
    delete process.env.KEYCLOAK_REALM_ROLES;
    delete process.env.KEYCLOAK_CLIENT_ID;
  });

  it("should transform OpenMRS user to Keycloak user format", () => {
    const result = transformToKeycloakUser(mockUser);

    expect(result).toEqual({
      username: "testuser",
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      enabled: true,
      emailVerified: true,
      createdTimestamp: expect.any(Number),
      totp: false,
      credentials: [
        {
          type: "password",
          value: "test-password",
        },
      ],
      attributes: {
        source_system: "openmrs",
        openmrs_user_uuid: "test-uuid",
      },
      disableableCredentialTypes: [],
      requiredActions: [],
      realmRoles: ["default-role"],
      clientRoles: {},
      notBefore: 0,
      groups: []
    });
  });

  it("should handle missing optional fields", () => {
    const userWithMissingFields: OpenMRSUser = {
      ...mockUser,
      given_name: null,
      family_name: null,
      email: null,
    };

    const result = transformToKeycloakUser(userWithMissingFields);

    expect(result.firstName).toBe("");
    expect(result.lastName).toBe("");
    expect(result.email).toBe("");
  });
});
