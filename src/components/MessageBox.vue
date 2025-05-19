<template>
  <div v-if="displayMessage"
       :class="computedClasses"
       class="p-3 sm:p-4 mb-4 rounded-md text-xs sm:text-sm relative shadow"
       role="alert">
    <p>{{ displayMessage }}</p>
    <button @click="clear" title="Close message"
            class="absolute top-1 right-1 sm:top-2 sm:right-3 p-1 rounded-full leading-none text-base sm:text-lg hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-neutral-800 focus:ring-current transition-opacity duration-150">
      &times;
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { AppError } from '@/types';

interface Props {
  message?: string | null;
  error?: AppError | string | null;
  type?: 'info' | 'success' | 'warning' | 'error';
}

const props = withDefaults(defineProps<Props>(), {
  message: null,
  error: null,
  type: 'info',
});

const emit = defineEmits<{
  (e: 'clear'): void;
}>();

const displayMessage = computed(() => {
  if (props.error) {
    return typeof props.error === 'string' ? props.error : props.error.message;
  }
  return props.message;
});

const messageType = computed(() => {
  if (props.error) return 'error';
  if (props.message && props.type) return props.type;
  return 'info';
})

const computedClasses = computed(() => {
  let base = 'border ';
  switch (messageType.value) {
    case 'success': return base + 'bg-green-100 border-green-400 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-300';
    case 'warning': return base + 'bg-yellow-100 border-yellow-400 text-yellow-700 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-300';
    case 'error': return base + 'bg-red-100 border-red-400 text-red-700 dark:bg-red-900 dark:border-red-700 dark:text-red-300';
    default: return base + 'bg-blue-100 border-blue-400 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-300';
  }
});

const clear = () => {
  emit('clear');
};
</script>
