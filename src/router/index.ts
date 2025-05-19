import { createRouter, createWebHistory, RouteRecordRaw, NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

import LoginView from '@/views/LoginView.vue';
import RegisterView from '@/views/RegisterView.vue';
import DashboardView from '@/views/DashboardView.vue';
import NoteEditorView from '@/views/NoteEditorView.vue';

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        redirect: '/dashboard'
    },
    {
        path: '/login',
        name: 'Login',
        component: LoginView,
        meta: { requiresGuest: true }
    },
    {
        path: '/register',
        name: 'Register',
        component: RegisterView,
        meta: { requiresGuest: true }
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: DashboardView,
        meta: { requiresAuth: true }
    },
    {
        path: '/note/:id',
        name: 'NoteEditor',
        component: NoteEditorView,
        props: true,
        meta: { requiresAuth: true }
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: { template: '<div class="text-center p-10"><h1 class="text-4xl font-bold">404 - Page Not Found</h1><router-link to="/" class="text-indigo-600 hover:underline mt-4 inline-block">Go Home</router-link></div>' }
    }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition;
        } else {
            return { top: 0, behavior: 'smooth' };
        }
    }
});

// Navigation Guard
router.beforeEach(async (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
    const authStore = useAuthStore();

    if (authStore.user === null && !authStore.loading && !authStore.session) {
        if (!authStore.loading) {
            await authStore.initializeAuth();
        }
    }

    const isAuthenticated = authStore.isAuthenticated;
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    const requiresGuest = to.matched.some(record => record.meta.requiresGuest);

    if (requiresAuth && !isAuthenticated) {
        if (authStore.user && !authStore.derivedKey && to.name === 'Dashboard') {
            next();
        } else if (authStore.user && !authStore.derivedKey && to.name === 'NoteEditor') {
            // If trying to edit/create note without key, redirect to dashboard to unlock
            authStore.error = "Please unlock your notes on the dashboard first.";
            next({ name: 'Dashboard', query: { redirect: to.fullPath } });
        }
        else {
            authStore.error = "You must be logged in and notes unlocked to access this page.";
            next({ name: 'Login', query: { redirect: to.fullPath } });
        }
    } else if (requiresGuest && isAuthenticated) {
        next({ name: 'Dashboard' });
    } else {
        next();
    }
});

export default router;