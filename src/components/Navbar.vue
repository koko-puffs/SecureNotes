<template>
  <nav class="bg-neutral-900 text-neutral-100 sticky top-0 z-50 border-b border-neutral-800">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
      <router-link to="/" class="text-xl sm:text-2xl font-bold hover:text-neutral-200 transition-colors flex items-center">
        <BookLock class="w-6 h-6 sm:w-7 sm:h-7 mr-2 shrink-0" />
        <span class="hidden sm:inline">SecureNotes</span>
        <span class="sm:hidden">SN</span>
      </router-link>
      <div class="space-x-3 sm:space-x-4 text-sm sm:text-base">
        <template v-if="authStore.isAuthenticated">
          <router-link to="/dashboard" class="hover:text-neutral-200 transition-colors">Dashboard</router-link>
          <button @click="handleLogout" class="hover:text-red-400 transition-colors">Logout</button>
        </template>
        <template v-else>
          <router-link to="/login" class="hover:text-neutral-200 transition-colors">Login</router-link>
          <router-link to="/register" class="hover:text-neutral-200 transition-colors">Register</router-link>
        </template>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { BookLock } from 'lucide-vue-next';

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = async () => {
  await authStore.logout();
  router.push({ name: 'Login' });
};
</script>