export const GET_USERS_QUERY = `
  SELECT 
    u.uuid,
    u.user_id,
    u.username,
    pn.given_name,
    pn.middle_name,
    pn.family_name,
    u.email
  FROM
    users u
    LEFT JOIN person_name pn ON (u.person_id = pn.person_id)
  WHERE
    u.retired = 0 AND pn.voided = 0 AND pn.preferred = 1;
`; 