<template>
  <div :class="itemClasses" @click="handleEdit">
    <div class="p-4 sm:p-5 flex-grow">
      <h3 class="text-md sm:text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-1 truncate" :title="note.title || 'Untitled Note'">
        {{ note.title || 'Untitled Note' }}
      </h3>
      <p v-if="note.decryption_error" class="text-xs sm:text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 p-2 rounded-md">
        <AlertTriangle class="w-4 h-4 inline mr-1" /> {{ note.decryption_error }}
      </p>
      <p v-else-if="note.decrypted_content" class="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3">
        {{ note.decrypted_content }}
      </p>
      <p v-else class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 italic">
        Content encrypted or not available.
      </p>
    </div>
    <div class="border-t border-neutral-800 dark:border-neutral-800 p-2 sm:p-3 flex justify-end items-center space-x-2 bg-neutral-100 dark:bg-neutral-900/60 rounded-b-lg">
      <p class="text-xs text-neutral-500 dark:text-neutral-400 mr-auto">{{ formattedDate(note.updated_at) }}</p>
      <button v-if="!note.decryption_error" @click.stop="handleEdit" title="Edit Note"
              class="p-1.5 sm:p-2 rounded-md hover:bg-neutral-600 text-neutral-400 transition-colors cursor-pointer">
        <FilePenLine class="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
      <button @click.stop="handleDelete" title="Delete Note"
              class="p-1.5 sm:p-2 rounded-md hover:bg-neutral-600 text-red-400 transition-colors cursor-pointer">
        <Trash2 class="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Note } from '@/types';
import moment from 'moment';
import { FilePenLine, Trash2, AlertTriangle } from 'lucide-vue-next';

interface Props {
  note: Note;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'edit', id: string): void;
  (e: 'delete', id: string): void;
}>();

const formattedDate = (dateString: string): string => {
  return moment(dateString).format('MMM D, YY h:mm A');
};

const itemClasses = computed(() => [
  'bg-white dark:bg-neutral-900 rounded-lg shadow-lg dark:shadow-none dark:border dark:border-neutral-800 hover:shadow-xl dark:hover:bg-neutral-800 transition-all duration-200 flex flex-col justify-between',
  props.note.decryption_error ? 'border-2 border-red-300 dark:border-red-600 cursor-not-allowed' : 'cursor-pointer'
]);

const handleEdit = () => {
  if (!props.note.decryption_error) {
    emit('edit', props.note.id);
  }
};

const handleDelete = () => {
  emit('delete', props.note.id);
};
</script>
