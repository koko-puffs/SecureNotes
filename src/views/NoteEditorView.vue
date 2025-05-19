<template>
  <div class="flex-grow"> <div class="max-w-3xl mx-auto bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-lg shadow-lg dark:shadow-none dark:border dark:border-neutral-800">
    <h2 class="text-2xl sm:text-3xl font-bold mb-6 text-neutral-700 dark:text-neutral-100">
      {{ isNewNote ? 'Create New Note' : 'Edit Note' }}
    </h2>

    <MessageBox :error="localError || notesStore.error" @clear="clearAllMessages" class="mb-4"/>
    <MessageBox :message="notesStore.message" type="success" @clear="notesStore.clearMessages()" class="mb-4"/>

    <form @submit.prevent="saveNoteHandler" v-if="!formDisabled">
      <div class="mb-4">
        <label for="noteTitle" class="block text-sm font-medium text-neutral-500 dark:text-neutral-300 mb-1">Title</label>
        <input type="text" v-model="noteTitle" id="noteTitle" required
               class="w-full px-3 sm:px-4 py-2 border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder-neutral-500 dark:placeholder-neutral-400"
               placeholder="My Awesome Note">
      </div>
      <div class="mb-6">
        <label for="noteContent" class="block text-sm font-medium text-neutral-500 dark:text-neutral-300 mb-1">Content</label>
        <textarea v-model="noteContent" id="noteContent" rows="10" sm:rows="12" required
                  class="w-full px-3 sm:px-4 py-2 border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-md shadow-sm focus:ring-2 focus:ring-offset-1 focus:ring-neutral-500 dark:focus:ring-offset-neutral-800 dark:focus:ring-neutral-400 focus:border-transparent transition-colors custom-scrollbar placeholder-neutral-500 dark:placeholder-neutral-400"
                  placeholder="Start writing your secure thoughts here..."></textarea>
      </div>
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <router-link :to="{ name: 'Dashboard' }"
                     class="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline font-medium text-sm flex items-center group transition-colors duration-150">
          <ArrowLeft class="w-4 h-4 inline mr-1 shrink-0"/> Back to Dashboard
        </router-link>
        <button type="submit" :disabled="notesStore.loading || formDisabled"
                class="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-6 rounded-md shadow-sm dark:shadow-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-neutral-900 active:bg-green-700 active:scale-95 transition-all duration-150 disabled:opacity-50 flex items-center justify-center">
          <LoaderCircle v-if="notesStore.loading" class="animate-spin w-5 h-5 mr-2"/>
          <Save class="w-5 h-5 mr-2 shrink-0"/>
          {{ isNewNote ? 'Create Note' : 'Save Changes' }}
        </button>
      </div>
    </form>
    <div v-else class="text-center p-4 bg-yellow-50 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700 rounded-md">
      <p class="text-yellow-700 dark:text-yellow-200">{{ localError || "Cannot edit this note."}}</p>
      <router-link :to="{ name: 'Dashboard' }"
                   class="mt-4 inline-block text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors font-medium text-sm">
        Go to Dashboard
      </router-link>
    </div>
    <p class="mt-6 text-xs text-center text-neutral-500 dark:text-neutral-400">
      All notes are encrypted on your device before being saved.
    </p>
  </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNotesStore } from '@/stores/notes';
import { useAuthStore } from '@/stores/auth';
import type { AppError } from '@/types';
import MessageBox from '@/components/MessageBox.vue';
import { Save, LoaderCircle, ArrowLeft } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const notesStore = useNotesStore();
const authStore = useAuthStore();

const noteId = ref<string>(route.params.id as string);
const isNewNote = computed(() => noteId.value === 'new');
const noteTitle = ref('');
const noteContent = ref('');
const localError = ref<AppError | string | null>(null);
const formDisabled = ref(false);


const clearAllMessages = () => {
  localError.value = null;
  notesStore.clearMessages();
  authStore.clearMessages();
};

const loadNoteData = async () => {
  clearAllMessages();
  formDisabled.value = false;

  if (!authStore.isAuthenticated || !authStore.derivedKey) {
    localError.value = "You must be logged in and your notes unlocked to manage them.";
    formDisabled.value = true;
    return;
  }

  if (isNewNote.value) {
    noteTitle.value = '';
    noteContent.value = '';
  } else {
    let existingNote = notesStore.notes.find(n => n.id === noteId.value);

    if (!existingNote && notesStore.notes.length === 0 && authStore.isAuthenticated) {
      // If notes are not loaded yet, fetch them
      await notesStore.fetchNotes();
      existingNote = notesStore.notes.find(n => n.id === noteId.value);
    }


    if (existingNote) {
      if (existingNote.decryption_error) {
        localError.value = `Error: ${existingNote.decryption_error} Editing is disabled.`;
        noteTitle.value = existingNote.title || 'Error: Cannot Decrypt';
        noteContent.value = existingNote.decryption_error || "Content cannot be decrypted.";
        formDisabled.value = true;
      } else {
        noteTitle.value = existingNote.title;
        noteContent.value = existingNote.decrypted_content || '';
      }
    } else {
      localError.value = 'Note not found. It might have been deleted or an error occurred.';
      formDisabled.value = true;
    }
  }
};

onMounted(loadNoteData);

watch(() => route.params.id, (newId) => {
  if (newId) {
    noteId.value = newId as string;
    loadNoteData();
  }
}, { immediate: false }); // 'immediate: false' because onMounted handles initial load


const saveNoteHandler = async () => {
  clearAllMessages();
  if (formDisabled.value) {
    localError.value = "Cannot save, form is disabled due to an error.";
    return;
  }
  if (!noteTitle.value.trim()) { // Basic validation
    localError.value = "Title cannot be empty.";
    return;
  }
  if (!noteContent.value.trim()) { // Basic validation
    localError.value = "Content cannot be empty.";
    return;
  }
  if (!authStore.isAuthenticated || !authStore.derivedKey) {
    localError.value = "Authentication or encryption key is missing. Cannot save.";
    return;
  }

  let success = false;
  if (isNewNote.value) {
    const newNote = await notesStore.addNote(noteTitle.value, noteContent.value);
    if (newNote && newNote.id) {
      success = true;
      router.replace({ name: 'NoteEditor', params: { id: newNote.id } });
    }
  } else {
    success = await notesStore.updateNote(noteId.value, noteTitle.value, noteContent.value);
  }

  if (!success && !notesStore.error) { // If store didn't set an error, set a generic one
    localError.value = notesStore.error || "Failed to save note due to an unknown issue.";
  }
};
</script>