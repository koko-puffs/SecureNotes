import type { User as SupabaseUser } from '@supabase/supabase-js';


export interface Profile {
    id: SupabaseUser['id'];
    encryption_salt: string;
}

export interface Note {
    id: string;
    user_id: SupabaseUser['id'];
    title: string;
    encrypted_content_b64: string;
    iv_b64: string;
    created_at: string;
    updated_at: string;

    // Only available on the client-side after decryption
    decrypted_content?: string | null;
    decryption_error?: string | null;
}

export interface AppError {
    message: string;
    name?: string;
    status?: number;
}