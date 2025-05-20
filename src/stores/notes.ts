import { defineStore } from 'pinia';
import { supabase } from '@/services/supabaseClient';
import cryptoService from '@/services/cryptoService';
import type { Note, AppError } from '@/types';
import { useAuthStore } from './auth';

interface NotesState {
    notes: Note[];
    loading: boolean;
    error: AppError | string | null;
    message: string | null;
}

export const useNotesStore = defineStore('notes', {
    state: (): NotesState => ({
        notes: [],
        loading: false,
        error: null,
        message: null,
    }),
    actions: {
        clearMessages() {
            this.error = null;
            this.message = null;
        },

        clearNotesLocally() {
            this.notes = [];
        },

        async fetchNotes(): Promise<void> {
            const authStore = useAuthStore();
            if (!authStore.isAuthenticated || !authStore.derivedKey || !authStore.user) {
                this.error = "Cannot fetch notes: User not authenticated or encryption key not available.";
                this.notes = [];
                return;
            }
            this.loading = true;
            this.clearMessages();
            try {
                const { data, error: dbError } = await supabase
                    .from('notes')
                    .select('*')
                    .eq('user_id', authStore.user.id)
                    .order('updated_at', { ascending: false });

                if (dbError) throw dbError;

                const decryptedNotes: Note[] = [];
                for (const noteRecord of data as Omit<Note, 'decrypted_content' | 'decryption_error'>[]) {
                    try {
                        const ciphertext = cryptoService.base64ToUint8Array(noteRecord.encrypted_content_b64);
                        const iv = cryptoService.base64ToUint8Array(noteRecord.iv_b64);
                        const decrypted_content = await cryptoService.decryptNote(ciphertext, iv, authStore.derivedKey);
                        decryptedNotes.push({ ...noteRecord, decrypted_content });
                    } catch (decryptionError) {
                        console.error(`Failed to decrypt note ${noteRecord.id}:`, decryptionError);
                        decryptedNotes.push({
                            ...noteRecord,
                            decrypted_content: null,
                            decryption_error: "Could not decrypt this note. Key may have changed or data is corrupt."
                        });
                    }
                }
                this.notes = decryptedNotes;
            } catch (err) {
                console.error("Error fetching notes:", err);
                this.error = { message: (err as Error).message || "Failed to fetch notes." };
                this.notes = []; // Clear notes on error
            } finally {
                this.loading = false;
            }
        },

        async addNote(title: string, plaintext_content: string): Promise<Note | null> {
            const authStore = useAuthStore();
            if (!authStore.isAuthenticated || !authStore.derivedKey || !authStore.user) {
                this.error = "Cannot add note: User not authenticated or encryption key not available.";
                return null;
            }
            this.loading = true;
            this.clearMessages();
            try {
                const { ciphertext, iv } = await cryptoService.encryptNote(plaintext_content, authStore.derivedKey);
                const encrypted_content_b64 = cryptoService.uint8ArrayToBase64(ciphertext);
                const iv_b64 = cryptoService.uint8ArrayToBase64(iv);

                const noteToInsert = {
                    user_id: authStore.user.id,
                    title: title,
                    encrypted_content_b64: encrypted_content_b64,
                    iv_b64: iv_b64,
                };

                const { data, error: dbError } = await supabase
                    .from('notes')
                    .insert(noteToInsert)
                    .select()
                    .single<Note>(); // Expect a single Note object back

                if (dbError) throw dbError;
                if (!data) throw new Error("Failed to create note: No data returned from server.");

                const newNoteWithDecryptedContent: Note = { ...data, decrypted_content: plaintext_content };
                this.notes.unshift(newNoteWithDecryptedContent); // Add to the beginning of the local array
                this.message = "Note added successfully.";
                return newNoteWithDecryptedContent;
            } catch (err) {
                console.error("Error adding note:", err);
                this.error = { message: (err as Error).message || "Failed to add note." };
                return null;
            } finally {
                this.loading = false;
            }
        },

        async updateNote(noteId: string, title: string, plaintext_content: string): Promise<boolean> {
            const authStore = useAuthStore();
            if (!authStore.isAuthenticated || !authStore.derivedKey || !authStore.user) {
                this.error = "Cannot update note: User not authenticated or encryption key not available.";
                return false;
            }
            this.loading = true;
            this.clearMessages();
            try {
                const { ciphertext, iv } = await cryptoService.encryptNote(plaintext_content, authStore.derivedKey);
                const encrypted_content_b64 = cryptoService.uint8ArrayToBase64(ciphertext);
                const iv_b64 = cryptoService.uint8ArrayToBase64(iv);

                const noteToUpdate = {
                    title: title,
                    encrypted_content_b64: encrypted_content_b64,
                    iv_b64: iv_b64,
                    updated_at: new Date().toISOString(),
                };

                const { data, error: dbError } = await supabase
                    .from('notes')
                    .update(noteToUpdate)
                    .eq('id', noteId)
                    .eq('user_id', authStore.user.id) // RLS check on client too
                    .select()
                    .single<Note>();

                if (dbError) throw dbError;
                if (!data) throw new Error("Failed to update note: No data returned from server or note not found.");

                const index = this.notes.findIndex(n => n.id === noteId);
                if (index !== -1) {
                    this.notes[index] = { ...this.notes[index], ...data, decrypted_content: plaintext_content };
                }
                this.message = "Note updated successfully.";
                return true;
            } catch (err) {
                console.error("Error updating note:", err);
                this.error = { message: (err as Error).message || "Failed to update note." };
                return false;
            } finally {
                this.loading = false;
            }
        },

        async deleteNote(noteId: string): Promise<boolean> {
            const authStore = useAuthStore();
            if (!authStore.user) {
                this.error = "Cannot delete note: User not authenticated.";
                return false;
            }
            this.loading = true;
            this.clearMessages();
            try {
                const { error: dbError } = await supabase
                    .from('notes')
                    .delete()
                    .eq('id', noteId)
                    .eq('user_id', authStore.user.id);

                if (dbError) throw dbError;

                this.notes = this.notes.filter(n => n.id !== noteId);
                this.message = "Note deleted successfully.";
                return true;
            } catch (err) {
                console.error("Error deleting note:", err);
                this.error = { message: (err as Error).message || "Failed to delete note." };
                return false;
            } finally {
                this.loading = false;
            }
        }
    }
});
