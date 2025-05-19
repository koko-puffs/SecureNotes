<template>
  <Navbar />
  <main class="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </main>
</template>

<script setup lang="ts">
import Navbar from '@/components/Navbar.vue';
</script>