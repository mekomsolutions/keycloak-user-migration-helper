export const GET_USERS_QUERY = `
SELECT
    ru.login,
    rp.name,
    rp.email,
    rp.email_normalized,
    rp.phone,
    rp.phone_sanitized,
    ru.id as user_id,
    rp.id as partner_id
FROM
    res_users ru
    LEFT JOIN res_partner rp ON (ru.partner_id = rp.id)
WHERE
    ru.active IS TRUE 
    AND rp.active IS TRUE
    AND ru.login IS NOT NULL
    AND ru.login != ''
`;
