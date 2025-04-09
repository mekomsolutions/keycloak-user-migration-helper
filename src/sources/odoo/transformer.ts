import { OdooUser } from "./types";
import { KeycloakUser } from "../../types/keycloak";

export function transformToKeycloakUser(user: OdooUser): KeycloakUser {
  const email = user.email_normalized || user.email || "";
  const username = user.login.toLowerCase().trim();

  return {
    username,
    email,
    firstName: user.name.split(" ")[0] || "",
    lastName: user.name.split(" ").slice(1).join(" ") || "",
    enabled: true,
    emailVerified: true,
    createdTimestamp: Date.now(),
    totp: false,
    credentials: [
      {
        type: "password",
        value: process.env.KEYCLOAK_DEFAULT_PASSWORD!,
      },
    ],
    attributes: {
      source_system: "odoo",
      source_id: user.user_id.toString(),
      partner_id: user.partner_id.toString(),
      phone: user.phone_sanitized || user.phone || "",
    },
    disableableCredentialTypes: [],
    requiredActions: [],
    realmRoles: JSON.parse(process.env.KEYCLOAK_REALM_ROLES!),
    clientRoles: {},
    notBefore: 0,
    groups: [],
  };
}
