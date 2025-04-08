export interface OdooUser {
    login: string;
    name: string;
    email: string | null;
    email_normalized: string | null;
    phone: string | null;
    phone_sanitized: string | null;
    user_id: number;
    partner_id: number;
} 