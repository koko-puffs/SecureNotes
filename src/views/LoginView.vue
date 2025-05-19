<template>
  <div class="flex-grow flex items-center justify-center p-4 sm:p-6">
    <div class="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-lg shadow-lg dark:shadow-none dark:border dark:border-neutral-800 w-full max-w-md">
      <h2 class="text-2xl sm:text-3xl font-bold mb-6 text-center text-neutral-700 dark:text-neutral-200">Login</h2>
      <MessageBox :error="authStore.error" @clear="authStore.clearMessages()" class="mb-4"/>
      <MessageBox :message="authStore.message" type="success" @clear="authStore.clearMessages()" class="mb-4"/>

      <form @submit.prevent="handleLogin">
        <div class="mb-4">
          <label for="email" class="block text-sm font-medium text-neutral-500 dark:text-neutral-300 mb-1">Email</label>
          <input type="email" v-model="email" id="email" required
                 class="w-full px-3 sm:px-4 py-2 border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder-neutral-500 dark:placeholder-neutral-400"
                 placeholder="you@example.com">
        </div>
        <div class="mb-6">
          <label for="password" class="block text-sm font-medium text-neutral-500 dark:text-neutral-300 mb-1">Password</label>
          <input type="password" v-model="password" id="password" required
                 class="w-full px-3 sm:px-4 py-2 border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder-neutral-500 dark:placeholder-neutral-400"
                 placeholder="••••••••">
        </div>
        <button type="submit" :disabled="authStore.loading"
                class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-md shadow-sm dark:shadow-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-neutral-900 active:bg-indigo-700 active:scale-95 transition-all duration-150 disabled:opacity-50 flex items-center justify-center">
          <LoaderCircle v-if="authStore.loading" class="animate-spin w-5 h-5 mr-2"/>
          Login
        </button>
      </form>
      <p class="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
        Don't have an account?
        <router-link :to="{ name: 'Register' }" class="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">Register here</router-link>
      </p>
      <p class="mt-4 text-xs text-center text-neutral-500 dark:text-neutral-400">
        Your password is used to encrypt your notes locally. It is never sent to the server.
        <br/><strong>If you forget your password, your notes cannot be recovered.</strong>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useNotesStore } from '@/stores/notes';
import MessageBox from '@/components/MessageBox.vue';
import { LoaderCircle } from 'lucide-vue-next';

const email = ref('');
const password = ref('');
const authStore = useAuthStore();
const notesStore = useNotesStore();
const router = useRouter();
const route = useRoute();

const handleLogin = async () => {
  const success = await authStore.login(email.value, password.value);
  if (success) {
    await notesStore.fetchNotes(); // Eagerly fetch notes
    const redirectPath = route.query.redirect as string | undefined;
    await router.push(redirectPath || { name: 'Dashboard' });
  }
};

onMounted(() => {
  authStore.clearMessages();
});
</script>