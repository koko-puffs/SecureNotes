<template>
  <div class="flex-grow"> <div class="max-w-6xl mx-auto">
    <div class="flex flex-wrap justify-between items-center mb-6 gap-4">
      <h1 class="text-2xl sm:text-3xl font-bold text-neutral-800 dark:text-neutral-100">My Secure Notes</h1>
      <router-link :to="{ name: 'NoteEditor', params: { id: 'new' } }"
                   class="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-md shadow-sm dark:shadow-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-neutral-900 active:bg-indigo-700 active:scale-95 transition-all duration-150 flex items-center text-sm sm:text-base disabled:opacity-50">
        <PlusCircle class="w-5 h-5 mr-2"/> New Note
      </router-link>
    </div>

    <MessageBox :error="notesStore.error" @clear="notesStore.clearMessages()" class="mb-4"/>
    <MessageBox :message="notesStore.message" type="success" @clear="notesStore.clearMessages()" class="mb-4"/>

    <MessageBox v-if="authStore.error && typeof authStore.error === 'object' && authStore.error.message !== 'Password needed to decrypt notes.'"
                :error="authStore.error" type="warning"
                @clear="authStore.clearMessages()" class="mb-4"/>
    <MessageBox v-if="authStore.error && typeof authStore.error === 'string'"
                :error="authStore.error" type="warning"
                @clear="authStore.clearMessages()" class="mb-4"/>


    <div v-if="authStore.loading || (notesStore.loading && !authStore.derivedKey)" class="text-center py-10">
      <LoaderCircle class="animate-spin w-10 h-10 sm:w-12 sm:h-12 mx-auto text-indigo-600 dark:text-indigo-400"/>
      <p class="mt-2 text-neutral-600 dark:text-neutral-400">Loading...</p>
    </div>

    <div v-else-if="!authStore.derivedKey && authStore.user" class="bg-yellow-50 dark:bg-neutral-800 border-l-4 border-yellow-500 dark:border-yellow-600 p-4 rounded-md dark:shadow-none">
      <div class="flex">
        <div class="flex-shrink-0">
          <KeyRound class="h-6 w-6 text-yellow-500 dark:text-yellow-400" aria-hidden="true" />
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">Unlock Your Notes</p>
          <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
            Please enter your password to decrypt and access your notes.
          </p>
          <form @submit.prevent="unlockNotesHandler" class="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input type="password" v-model="passwordToUnlock" placeholder="Enter your password"
                   class="flex-grow px-3 py-2 border border-yellow-400 dark:border-yellow-600 bg-white dark:bg-neutral-700 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm text-neutral-700 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500" required>
            <button type="submit" :disabled="authStore.loading"
                    class="bg-yellow-500 hover:bg-yellow-400 text-yellow-900 font-semibold py-2 px-3 rounded-md shadow-sm dark:shadow-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 dark:focus:ring-offset-neutral-800 active:bg-yellow-600 active:scale-95 transition-all duration-150 text-sm disabled:opacity-50 flex items-center justify-center">
              <LoaderCircle v-if="authStore.loading" class="animate-spin w-4 h-4 mr-1"/>
              Unlock
            </button>
          </form>
          <MessageBox :error="unlockError" @clear="unlockError = null" class="mt-2"/>
        </div>
      </div>
    </div>

    <div v-else-if="notesStore.loading" class="text-center py-10">
      <LoaderCircle class="animate-spin w-10 h-10 sm:w-12 sm:h-12 mx-auto text-indigo-600 dark:text-indigo-400"/>
      <p class="mt-2 text-neutral-600 dark:text-neutral-400">Loading notes...</p>
    </div>

    <div v-else-if="notesStore.notes.length === 0 && authStore.isAuthenticated" class="text-center py-10 bg-white dark:bg-neutral-800 rounded-lg shadow-md dark:shadow-none dark:border dark:border-neutral-700">
      <FileText class="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-neutral-400 dark:text-neutral-500 mb-4"/>
      <h3 class="text-lg sm:text-xl font-semibold text-neutral-700 dark:text-neutral-200">No notes yet!</h3>
      <p class="text-neutral-500 dark:text-neutral-400 mt-2 text-sm sm:text-base">Click "New Note" to create your first secure journal entry.</p>
    </div>

    <div v-else-if="notesStore.notes.length > 0 && authStore.isAuthenticated" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <NoteItem v-for="note in notesStore.notes" :key="note.id" :note="note"
                @edit="editNoteHandler" @delete="confirmDeleteNoteHandler"/>
    </div>
  </div>

    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[100] transition-opacity duration-300"
         :class="showDeleteModal ? 'opacity-100' : 'opacity-0 pointer-events-none'">
      <div class="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-lg dark:shadow-none dark:border dark:border-neutral-700 w-full max-w-sm transform transition-all duration-300"
           :class="showDeleteModal ? 'scale-100' : 'scale-95'">
        <h3 class="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2 flex items-center">
          <AlertTriangle class="w-5 h-5 mr-2 text-red-500 dark:text-red-400"/> Confirm Deletion
        </h3>
        <p class="text-sm text-neutral-600 dark:text-neutral-300 mb-4">Are you sure you want to delete the note titled "<strong>{{ noteToDelete?.title || 'this note' }}</strong>"? This action cannot be undone.</p>
        <div class="flex justify-end space-x-3">
          <button @click="showDeleteModal = false" class="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-md shadow-sm dark:shadow-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-400 dark:focus:ring-offset-neutral-800 dark:focus:ring-neutral-500 active:bg-neutral-400 dark:active:bg-neutral-500 active:scale-95 transition-all duration-150">Cancel</button>
          <button @click="executeDeleteNoteHandler"
                  :disabled="notesStore.loading"
                  class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-md shadow-sm dark:shadow-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-neutral-800 active:bg-red-700 active:scale-95 transition-all duration-150 disabled:opacity-50 flex items-center">
            <LoaderCircle v-if="notesStore.loading" class="animate-spin w-4 h-4 mr-2"/>
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useNotesStore } from '@/stores/notes';
import type { Note, AppError } from '@/types';
import NoteItem from '@/components/NoteItem.vue';
import MessageBox from '@/components/MessageBox.vue';
import { PlusCircle, LoaderCircle, KeyRound, FileText, AlertTriangle } from 'lucide-vue-next';

const authStore = useAuthStore();
const notesStore = useNotesStore();
const router = useRouter();

const passwordToUnlock = ref('');
const unlockError = ref<AppError | string | null>(null);

const showDeleteModal = ref(false);
const noteToDelete = ref<Note | null>(null);

onMounted(async () => {
  authStore.clearMessages();
  notesStore.clearMessages();
  if (authStore.isAuthenticated && authStore.derivedKey) {
    if (notesStore.notes.length === 0) { // Only fetch if notes aren't already loaded
      await notesStore.fetchNotes();
    }
  } else if (authStore.user && !authStore.derivedKey) {
    console.log("User session active, but encryption key not derived. Prompting for password.");
    // UI will show the password prompt.
  }
});

// Watch for authentication changes (after logout from another tab, or session expiry)
watch(() => authStore.user, (newUser) => {
  if (!newUser) {
    notesStore.clearNotesLocally(); // Clear notes if user logs out
  }
});


const unlockNotesHandler = async () => {
  unlockError.value = null;
  const success = await authStore.deriveKeyWithPassword(passwordToUnlock.value);
  if (success) {
    passwordToUnlock.value = '';
    await notesStore.fetchNotes();
  } else {
    unlockError.value = authStore.error || "Failed to unlock notes. Please check your password.";
    authStore.error = null;
  }
};

const editNoteHandler = (noteId: string) => {
  router.push({ name: 'NoteEditor', params: { id: noteId } });
};

const confirmDeleteNoteHandler = (noteId: string) => {
  const note = notesStore.notes.find(n => n.id === noteId);
  if (note) {
    noteToDelete.value = note;
    showDeleteModal.value = true;
  }
};

const executeDeleteNoteHandler = async () => {
  if (noteToDelete.value) {
    await notesStore.deleteNote(noteToDelete.value.id);
    noteToDelete.value = null;
    showDeleteModal.value = false;
  }
};
</script>
