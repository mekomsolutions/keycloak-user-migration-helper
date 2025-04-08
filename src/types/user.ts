export interface OpenMRSUser {
  uuid: string;
  user_id: number;
  username: string;
  given_name: string | null;
  middle_name: string | null;
  family_name: string | null;
  email: string | null;
}

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
  attributes: {
    provider: string;
    openmrs_uuid: string;
  };
  disableableCredentialTypes: string[];
  requiredActions: string[];
  realmRoles: string[];
  clientRoles: {
    [key: string]: string[];
  };
  notBefore: number;
  groups: string[];
}

export interface KeycloakImport {
  users: KeycloakUser[];
}
