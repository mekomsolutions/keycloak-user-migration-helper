export interface OpenMRSUser {
  uuid: string;
  user_id: number;
  username: string;
  given_name: string | null;
  middle_name: string | null;
  family_name: string | null;
  email: string | null;
} 