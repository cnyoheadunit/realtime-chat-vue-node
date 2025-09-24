<template>
  <div class="layout-wrapper">
    <div class="layout-topbar">
      <div class="topbar-left">
        <h2 class="app-title">
          <i class="pi pi-comments mr-2"></i>
          Realtime Chat
        </h2>
      </div>
      
      <div class="topbar-right" v-if="authStore.isAuthenticated">
        <div class="user-info">
          <Avatar 
            :label="userInitials" 
            class="mr-2" 
            shape="circle" 
            size="normal"
          />
          <span class="username">{{ authStore.currentUser?.username }}</span>
        </div>
        
        <Button
          icon="pi pi-sign-out"
          class="p-button-text"
          @click="handleLogout"
          v-tooltip="'Logout'"
        />
      </div>
    </div>

    <div class="layout-content">
      <router-view />
    </div>

    <Toast />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useChatStore } from '../stores/chat'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const authStore = useAuthStore()
const chatStore = useChatStore()
const toast = useToast()

const userInitials = computed(() => {
  const username = authStore.currentUser?.username
  return username ? username.charAt(0).toUpperCase() : 'U'
})

const handleLogout = async () => {
  try {
    // Disconnect socket first
    chatStore.disconnectSocket()
    
    // Clear chat data
    chatStore.clearChatData()
    
    // Logout from auth
    await authStore.logout()
    
    // Redirect to login
    router.push('/login')
    
    toast.add({
      severity: 'success',
      summary: 'Logged Out',
      detail: 'You have been successfully logged out',
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Logout Error',
      detail: 'Failed to logout properly',
      life: 3000
    })
  }
}
</script>

<style scoped>
.layout-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-topbar {
  background: var(--surface-0);
  border-bottom: 1px solid var(--surface-border);
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.topbar-left {
  display: flex;
  align-items: center;
}

.app-title {
  margin: 0;
  color: var(--primary-color);
  font-size: 1.5rem;
  font-weight: 600;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.username {
  font-weight: 500;
  color: var(--text-color);
}

.layout-content {
  flex: 1;
  background: var(--surface-ground);
}

@media (max-width: 768px) {
  .layout-topbar {
    padding: 0.75rem 1rem;
  }
  
  .app-title {
    font-size: 1.25rem;
  }
  
  .username {
    display: none;
  }
}
</style>