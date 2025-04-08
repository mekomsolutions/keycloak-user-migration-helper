export interface KeycloakUser {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  enabled: boolean;
  emailVerified: boolean;
  createdTimestamp: number;
  totp: boolean;
  credentials: Array<{
    type: string;
    value: string;
  }>;
  attributes: Record<string, string>;
  disableableCredentialTypes: string[];
  requiredActions: string[];
  realmRoles: string[];
  clientRoles: Record<string, string[]>;
  notBefore: number;
  groups: string[];
}

export interface KeycloakImport {
  users: KeycloakUser[];
}
