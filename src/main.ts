import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './style.css'

import App from './App.vue';
import router from './router';
import { useAuthStore } from './stores/auth';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);

const authStore = useAuthStore();

authStore.initializeAuth()
  .catch(error => {
    console.error("Failed to initialize auth store before mounting:", error);
  })
  .finally(() => {
    app.use(router);
    router.isReady().then(() => {
        app.mount('#app');
    });
});
