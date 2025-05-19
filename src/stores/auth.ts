import { defineStore } from 'pinia';
import { supabase } from '@/services/supabaseClient';
import cryptoService from '@/services/cryptoService';
import type { User as SupabaseUser, Session as SupabaseSession, AuthError } from '@supabase/supabase-js';
import type { Profile, AppError } from '@/types';
import { useNotesStore } from './notes';

interface AuthState {
    user: SupabaseUser | null;
    session: SupabaseSession | null;
    encryptionSalt: Uint8Array | null;
    derivedKey: CryptoKey | null;
    loading: boolean;
    error: AppError | string | null;
    message: string | null;
}

export const useAuthStore = defineStore('auth', {
    state: (): AuthState => ({
        user: null,
        session: null,
        encryptionSalt: null,
        derivedKey: null,
        loading: false,
        error: null,
        message: null,
    }),
    getters: {
        isAuthenticated: (state): boolean => !!state.user && !!state.derivedKey,
    },
    actions: {
        clearMessages() {
            this.error = null;
            this.message = null;
        },

        async initializeAuth(): Promise<void> {
            this.loading = true;
            this.clearMessages();
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) throw sessionError;

                if (session) {
                    this.session = session;
                    this.user = session.user;
                    if (this.user) {
                        await this.fetchSalt();
                    }
                }
            } catch (err) {
                console.error("Auth initialization error:", err);
                this.error = { message: (err as AuthError).message || "Failed to initialize session." };
                this.user = null;
                this.session = null;
                this.derivedKey = null;
            } finally {
                this.loading = false;
            }
        },

        async fetchSalt(): Promise<boolean> {
            if (!this.user) {
                this.error = "User not available. Cannot fetch salt.";
                return false;
            }
            this.loading = true;
            try {
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('encryption_salt')
                    .eq('id', this.user.id)
                    .single<Pick<Profile, 'encryption_salt'>>();

                if (profileError) throw profileError;
                if (!profileData || !profileData.encryption_salt) {
                    throw new Error("Encryption salt not found for your account.");
                }
                this.encryptionSalt = cryptoService.base64ToUint8Array(profileData.encryption_salt);
                return true;
            } catch (err) {
                console.error("Error fetching salt:", err);
                this.error = { message: (err as Error).message || "Failed to fetch encryption salt."};
                this.encryptionSalt = null;
                return false;
            } finally {
                this.loading = false;
            }
        },


        async deriveKeyWithPassword(password: string): Promise<boolean> {
            if (!this.user) {
                this.error = "User not logged in. Cannot derive key.";
                return false;
            }
            if (!this.encryptionSalt) {
                const saltFetched = await this.fetchSalt();
                if (!saltFetched || !this.encryptionSalt) { // Check this.encryptionSalt again after fetchSalt
                    this.error = this.error || "Encryption salt is missing. Cannot derive key.";
                    return false;
                }
            }
            this.loading = true;
            this.clearMessages();
            try {
                this.derivedKey = await cryptoService.deriveKey(password, this.encryptionSalt);
                return true;
            } catch (err) {
                console.error("Error deriving key:", err);
                this.error = { message: (err as Error).message || "Failed to derive encryption key."};
                this.derivedKey = null;
                return false;
            } finally {
                this.loading = false;
            }
        },

        async register(email: string, password: string): Promise<boolean> {
            this.loading = true;
            this.clearMessages();
            try {
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (signUpError) {
                    throw signUpError;
                }
            } catch (err) {
                console.error("Registration error:", err);
                this.error = { message: (err as AuthError | Error).message || "An unknown registration error occurred."};
                return false;
            } finally {
                this.message = "Registration successful! Please check your email to confirm your account before logging in.";
                this.loading = false;
            }
        },

        async login(email: string, password: string): Promise<boolean> {
            this.loading = true;
            this.clearMessages();
            try {
                const { data: { user, session }, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (signInError) throw signInError;
                if (!user || !session) throw new Error("Login did not return a user or session object.");

                this.user = user;
                this.session = session;

                const keyDerived = await this.deriveKeyWithPassword(password);
                if (keyDerived) {
                    this.message = "Login successful!";
                    return true;
                } else {
                    this.user = null;
                    this.session = null;
                    return false;
                }
            } catch (err) {
                console.error("Login error:", err);
                this.error = { message: (err as AuthError | Error).message || "An unknown login error occurred."};
                this.user = null;
                this.session = null;
                this.derivedKey = null;
                return false;
            } finally {
                this.loading = false;
            }
        },

        async logout(): Promise<void> {
            this.loading = true;
            this.clearMessages();
            try {
                const { error } = await supabase.auth.signOut();
                if (error) throw error;
                this.message = "You have been logged out.";
            } catch (err) {
                console.error("Logout error:", err);
                this.error = { message: (err as AuthError).message || "Logout failed." };
            } finally {
                this.user = null;
                this.session = null;
                this.encryptionSalt = null;
                this.derivedKey = null;

                const notesStore = useNotesStore();
                notesStore.clearNotesLocally(); // Clear notes from local state

                this.loading = false;
            }
        }
    }
});
