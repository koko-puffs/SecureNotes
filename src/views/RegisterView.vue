<template>
  <div class="flex-grow flex items-center justify-center p-4 sm:p-6">
    <div class="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-lg shadow-lg dark:shadow-none dark:border dark:border-neutral-800 w-full max-w-md">
      <h2 class="text-2xl sm:text-3xl font-bold mb-6 text-center text-neutral-700 dark:text-neutral-200">Register</h2>
      <MessageBox :error="authStore.error" @clear="authStore.clearMessages()" class="mb-4"/>
      <MessageBox :message="authStore.message" type="success" @clear="authStore.clearMessages()" class="mb-4"/>

      <form @submit.prevent="handleRegister">
        <div class="mb-4">
          <label for="emailReg" class="block text-sm font-medium text-neutral-500 dark:text-neutral-300 mb-1">Email</label>
          <input type="email" v-model="email" id="emailReg" required
                 class="w-full px-3 sm:px-4 py-2 border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder-neutral-500 dark:placeholder-neutral-400"
                 placeholder="you@example.com"> 
        </div>
        <div class="mb-4">
          <label for="passwordReg" class="block text-sm font-medium text-neutral-500 dark:text-neutral-300 mb-1">Password</label>
          <input type="password" v-model="password" id="passwordReg" required minlength="8"
                 class="w-full px-3 sm:px-4 py-2 border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder-neutral-500 dark:placeholder-neutral-400"
                 placeholder="Minimum 8 characters">
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Choose a strong, unique password.</p>
        </div>
        <div class="mb-6">
          <label for="confirmPasswordReg" class="block text-sm font-medium text-neutral-500 dark:text-neutral-300 mb-1">Confirm Password</label>
          <input type="password" v-model="confirmPassword" id="confirmPasswordReg" required
                 class="w-full px-3 sm:px-4 py-2 border border-neutral-400 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder-neutral-500 dark:placeholder-neutral-400"
                 placeholder="Re-enter your password">
          <p v-if="password !== confirmPassword && confirmPassword" class="text-xs text-red-500 dark:text-red-400 mt-1">Passwords do not match.</p>
        </div>
        <button type="submit" :disabled="authStore.loading || password !== confirmPassword || password.length < 8"
                class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-md shadow-sm dark:shadow-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-neutral-900 active:bg-indigo-700 active:scale-95 transition-all duration-150 disabled:opacity-50 flex items-center justify-center">
          <LoaderCircle v-if="authStore.loading" class="animate-spin w-5 h-5 mr-2"/>
          Register
        </button>
      </form>
      <p class="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
        Already have an account?
        <router-link :to="{ name: 'Login' }" class="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">Login here</router-link>
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
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import MessageBox from '@/components/MessageBox.vue';
import { LoaderCircle } from 'lucide-vue-next';

const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const authStore = useAuthStore();
const router = useRouter();

const handleRegister = async () => {
  if (password.value !== confirmPassword.value) {
    authStore.error = "Passwords do not match.";
    return;
  }
  if (password.value.length < 8) {
    authStore.error = "Password must be at least 8 characters long.";
    return;
  }
  const success = await authStore.register(email.value, password.value);
  if (success) {
    await router.push({ name: 'Dashboard' });
  }
};

onMounted(() => {
  authStore.clearMessages();
});
</script>
