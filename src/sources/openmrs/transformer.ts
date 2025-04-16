import { OpenMRSUser } from './types';
import { KeycloakUser } from '../../types/keycloak';

export function transformToKeycloakUser(user: OpenMRSUser): KeycloakUser {
  return {
    username: user.username.toLowerCase().trim(),
    email: user.email || '',
    firstName: user.given_name || '',
    lastName: user.family_name || '',
    enabled: true,
    emailVerified: true,
    createdTimestamp: Date.now(),
    totp: false,
    credentials: [
      {
        type: 'password',
        value: process.env.KEYCLOAK_DEFAULT_PASSWORD!
      }
    ],
    attributes: {
      source_system: 'openmrs',
      openmrs_user_uuid: user.uuid,
    },
    disableableCredentialTypes: [],
    requiredActions: [],
    realmRoles: JSON.parse(process.env.KEYCLOAK_REALM_ROLES!),
    clientRoles: {},
    notBefore: 0,
    groups: []
  };
}
