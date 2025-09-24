<template>
  <div id="app">
    <!-- Show layout only for authenticated users -->
    <MainLayout v-if="authStore.isAuthenticated">
      <router-view />
    </MainLayout>
    
    <!-- Show router view directly for guest pages -->
    <router-view v-else />
    
    <Toast />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import MainLayout from './layouts/MainLayout.vue'

const authStore = useAuthStore()

onMounted(() => {
  // Initialize auth state from localStorage
  authStore.initializeAuth()
})
</script>

<style>
/* Global styles */
* {
  box-sizing: border-box;
}

#app {
  min-height: 100vh;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: var(--surface-100);
}

::-webkit-scrollbar-thumb {
  background: var(--surface-300);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--surface-400);
}

/* Utility classes */
.text-muted {
  color: var(--text-color-secondary) !important;
}

.mr-2 {
  margin-right: 0.5rem;
}

.ml-1 {
  margin-left: 0.25rem;
}

.ml-2 {
  margin-left: 0.5rem;
}

.mr-3 {
  margin-right: 0.75rem;
}

.mb-3 {
  margin-bottom: 0.75rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

.mt-3 {
  margin-top: 0.75rem;
}

.mt-4 {
  margin-top: 1rem;
}

.my-4 {
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.w-full {
  width: 100%;
}

.text-center {
  text-align: center;
}

.block {
  display: block;
}

.flex {
  display: flex;
}

.align-items-center {
  align-items: center;
}

.justify-content-center {
  justify-content: center;
}

.font-medium {
  font-weight: 500;
}

.font-600 {
  font-weight: 600;
}

/* PrimeVue customizations */
.p-card {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: none;
}

.p-button {
  border-radius: 0.5rem;
}

.p-inputtext, .p-password input {
  border-radius: 0.5rem;
}

.p-toast .p-toast-message {
  border-radius: 0.5rem;
}
</style>
