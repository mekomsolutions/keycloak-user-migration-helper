import { OpenMRSUser } from './types';
import { KeycloakUser } from '../../types/keycloak';

export function transformToKeycloakUser(user: OpenMRSUser): KeycloakUser {
  return {
    username: user.username,
    firstName: user.given_name || '',
    lastName: user.family_name || '',
    email: user.email || `${user.username}@example.com`,
    enabled: true,
    emailVerified: false,
    createdTimestamp: Date.now(),
    totp: false,
    credentials: [
      {
        type: 'password',
        value: process.env.KEYCLOAK_DEFAULT_PASSWORD!
      }
    ],
    attributes: {
      provider: 'true',
      openmrs_uuid: user.uuid,
      source_system: 'openmrs'
    },
    disableableCredentialTypes: [],
    requiredActions: ['UPDATE_PASSWORD'],
    realmRoles: process.env.KEYCLOAK_REALM_ROLES!.split(','),
    clientRoles: {
      [process.env.KEYCLOAK_CLIENT_ID!]: []
    },
    notBefore: 0,
    groups: []
  };
}
