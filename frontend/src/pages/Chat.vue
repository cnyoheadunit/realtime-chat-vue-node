<template>
  <div class="chat-container">
    <!-- Users Sidebar -->
    <div class="users-sidebar" :class="{ 'mobile-hidden': !showSidebar }">
      <div class="sidebar-header">
        <h3>
          <i class="pi pi-users mr-2"></i>
          Contacts
        </h3>
        <Button
          icon="pi pi-times"
          class="p-button-text sidebar-close-btn"
          @click="toggleSidebar"
        />
      </div>
      
      <div class="users-list">
        <div
          v-for="user in chatStore.users"
          :key="user.id"
          class="user-item"
          :class="{ 'active': currentChatUser?.id === user.id }"
          @click="selectUser(user)"
        >
          <div class="user-avatar">
            <Avatar 
              :label="user.username.charAt(0).toUpperCase()" 
              shape="circle" 
              size="normal"
            />
            <Badge 
              v-if="isUserOnline(user.id)" 
              severity="success" 
              class="online-badge"
            />
          </div>
          
          <div class="user-info">
            <div class="username">{{ user.username }}</div>
            <div class="user-status">
              {{ isUserOnline(user.id) ? 'Online' : 'Offline' }}
            </div>
          </div>
        </div>
        
        <div v-if="chatStore.users.length === 0" class="no-users">
          <i class="pi pi-users text-4xl text-muted"></i>
          <p class="text-muted">No users available</p>
        </div>
      </div>
    </div>

    <!-- Chat Area -->
    <div class="chat-area">
      <!-- Chat Header -->
      <div class="chat-header" v-if="currentChatUser">
        <Button
          icon="pi pi-bars"
          class="p-button-text sidebar-toggle-btn"
          @click="toggleSidebar"
        />
        
        <div class="chat-user-info">
          <Avatar 
            :label="currentChatUser.username.charAt(0).toUpperCase()" 
            shape="circle" 
            size="normal"
            class="mr-3"
          />
          <div>
            <div class="chat-username">{{ currentChatUser.username }}</div>
            <div class="chat-status">
              <span v-if="isUserOnline(currentChatUser.id)" class="online-status">
                <i class="pi pi-circle-fill text-green-500"></i> Online
              </span>
              <span v-else class="offline-status">
                <i class="pi pi-circle text-gray-400"></i> Offline
              </span>
              <span v-if="isUserTyping(currentChatUser.id)" class="typing-indicator ml-2">
                <i class="pi pi-ellipsis-h"></i> typing...
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Welcome Screen -->
      <div v-if="!currentChatUser" class="welcome-screen">
        <div class="welcome-content">
          <i class="pi pi-comments text-6xl text-primary mb-4"></i>
          <h2>Welcome to Realtime Chat</h2>
          <p class="text-muted">Select a contact from the sidebar to start chatting</p>
          <Button 
            label="Show Contacts" 
            icon="pi pi-users"
            class="mt-4"
            @click="showSidebar = true"
          />
        </div>
      </div>

      <!-- Chat Messages -->
      <div v-else class="chat-messages">
        <ScrollPanel class="messages-scroll">
          <div class="messages-container" ref="messagesContainer">
            <div
              v-for="message in currentMessages"
              :key="message.id"
              class="message-item"
              :class="{ 'own-message': message.senderId === authStore.currentUser.id }"
            >
              <div class="message-content">
                <div class="message-text">{{ message.message }}</div>
                <div class="message-time">
                  {{ formatMessageTime(message.created_at) }}
                  <i 
                    v-if="message.senderId === authStore.currentUser.id && message.isRead"
                    class="pi pi-check-double text-blue-500 ml-1"
                    title="Read"
                  ></i>
                </div>
              </div>
            </div>
            
            <div v-if="currentMessages.length === 0" class="no-messages">
              <i class="pi pi-comment text-4xl text-muted mb-3"></i>
              <p class="text-muted">No messages yet. Start the conversation!</p>
            </div>
          </div>
        </ScrollPanel>
      </div>

      <!-- Message Input -->
      <div v-if="currentChatUser" class="message-input-area">
        <div class="input-container">
          <Textarea
            v-model="newMessage"
            placeholder="Type your message..."
            :autoResize="true"
            rows="1"
            class="message-input"
            @keydown.enter.exact.prevent="sendMessage"
            @keydown.shift.enter="addNewLine"
            @input="handleTyping"
          />
          <Button
            icon="pi pi-send"
            class="send-button"
            :disabled="!newMessage.trim()"
            @click="sendMessage"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useChatStore } from '../stores/chat'
import { useToast } from 'primevue/usetoast'

const authStore = useAuthStore()
const chatStore = useChatStore()
const toast = useToast()

// Component state
const showSidebar = ref(false)
const newMessage = ref('')
const currentChatUser = ref(null)
const messagesContainer = ref(null)
const typingTimeout = ref(null)
const isTyping = ref(false)

// Computed properties
const currentMessages = computed(() => chatStore.currentMessages)

const isUserOnline = (userId) => chatStore.isUserOnline(userId)
const isUserTyping = (userId) => chatStore.isUserTyping(userId)

// Methods
const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
}

const selectUser = (user) => {
  currentChatUser.value = user
  chatStore.setCurrentChatUser(user)
  showSidebar.value = false
  
  // Focus message input
  nextTick(() => {
    const messageInput = document.querySelector('.message-input textarea')
    if (messageInput) {
      messageInput.focus()
    }
  })
}

const sendMessage = () => {
  if (!newMessage.value.trim() || !currentChatUser.value) return

  chatStore.sendMessage(currentChatUser.value.id, newMessage.value)
  newMessage.value = ''

  // Stop typing indicator
  if (isTyping.value) {
    chatStore.sendTyping(currentChatUser.value.id, false)
    isTyping.value = false
  }

  // Scroll to bottom
  scrollToBottom()
}

const addNewLine = () => {
  newMessage.value += '\n'
}

const handleTyping = () => {
  if (!currentChatUser.value) return

  // Send typing indicator if not already typing
  if (!isTyping.value) {
    isTyping.value = true
    chatStore.sendTyping(currentChatUser.value.id, true)
  }

  // Clear previous timeout
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }

  // Set new timeout to stop typing indicator
  typingTimeout.value = setTimeout(() => {
    if (isTyping.value) {
      isTyping.value = false
      chatStore.sendTyping(currentChatUser.value.id, false)
    }
  }, 1000)
}

const formatMessageTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = (now - date) / (1000 * 60 * 60)

  if (diffInHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } else if (diffInHours < 168) {
    return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// Handle window resize
const handleResize = () => {
  if (window.innerWidth > 768) {
    showSidebar.value = true
  } else {
    showSidebar.value = false
  }
}

// Initialize component
onMounted(async () => {
  try {
    // Initialize auth if needed
    if (!authStore.currentUser && authStore.token) {
      authStore.initializeAuth()
    }

    // Connect socket
    if (authStore.token) {
      chatStore.connectSocket(authStore.token)
    }

    // Load users
    await chatStore.loadUsers()

    // Set initial sidebar state
    handleResize()

    // Add resize listener
    window.addEventListener('resize', handleResize)

    toast.add({
      severity: 'success',
      summary: 'Connected',
      detail: 'Successfully connected to chat server',
      life: 3000
    })
  } catch (error) {
    console.error('Chat initialization error:', error)
    toast.add({
      severity: 'error',
      summary: 'Connection Error',
      detail: 'Failed to connect to chat server',
      life: 5000
    })
  }
})

// Cleanup
onUnmounted(() => {
  // Clear typing timeout
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }
  
  // Remove resize listener
  window.removeEventListener('resize', handleResize)
})

// Watch for new messages and scroll to bottom
watch(currentMessages, () => {
  scrollToBottom()
}, { deep: true })
</script>

<style scoped>
.chat-container {
  height: calc(100vh - 80px);
  display: flex;
  background: var(--surface-0);
}

/* Users Sidebar */
.users-sidebar {
  width: 300px;
  background: var(--surface-50);
  border-right: 1px solid var(--surface-border);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 1rem;
  border-bottom: 1px solid var(--surface-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-color);
}

.sidebar-close-btn {
  display: none;
}

.users-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
}

.user-item:hover {
  background: var(--surface-100);
}

.user-item.active {
  background: var(--primary-50);
  border-right: 3px solid var(--primary-color);
}

.user-avatar {
  position: relative;
  margin-right: 0.75rem;
}

.online-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--surface-0);
}

.user-info {
  flex: 1;
}

.username {
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.25rem;
}

.user-status {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.no-users {
  padding: 3rem 1rem;
  text-align: center;
}

/* Chat Area */
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chat-header {
  padding: 1rem;
  border-bottom: 1px solid var(--surface-border);
  background: var(--surface-0);
  display: flex;
  align-items: center;
}

.sidebar-toggle-btn {
  display: none;
  margin-right: 1rem;
}

.chat-user-info {
  display: flex;
  align-items: center;
}

.chat-username {
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.25rem;
}

.chat-status {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  display: flex;
  align-items: center;
}

.online-status, .offline-status {
  display: flex;
  align-items: center;
}

.typing-indicator {
  color: var(--primary-color);
  font-style: italic;
}

.welcome-screen {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.welcome-content {
  text-align: center;
  max-width: 400px;
}

.welcome-content h2 {
  margin: 0 0 1rem;
  color: var(--text-color);
}

/* Chat Messages */
.chat-messages {
  flex: 1;
  min-height: 0;
}

.messages-scroll {
  height: 100%;
}

.messages-container {
  padding: 1rem;
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.message-item {
  margin-bottom: 1rem;
  display: flex;
}

.message-item.own-message {
  justify-content: flex-end;
}

.message-content {
  max-width: 70%;
  background: var(--surface-100);
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  position: relative;
}

.own-message .message-content {
  background: var(--primary-color);
  color: white;
}

.message-text {
  word-wrap: break-word;
  white-space: pre-wrap;
  margin-bottom: 0.5rem;
}

.message-time {
  font-size: 0.75rem;
  opacity: 0.7;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.no-messages {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
}

/* Message Input */
.message-input-area {
  padding: 1rem;
  background: var(--surface-0);
  border-top: 1px solid var(--surface-border);
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
}

.message-input {
  flex: 1;
}

.send-button {
  height: fit-content;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .chat-container {
    height: calc(100vh - 60px);
  }

  .users-sidebar {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    z-index: 1000;
    box-shadow: 2px 0 8px rgba(0,0,0,0.15);
    transition: transform 0.3s ease;
  }

  .users-sidebar.mobile-hidden {
    transform: translateX(-100%);
  }

  .sidebar-close-btn {
    display: block;
  }

  .sidebar-toggle-btn {
    display: block;
  }

  .welcome-content Button {
    display: block;
  }

  .message-content {
    max-width: 85%;
  }
}

@media (max-width: 480px) {
  .users-sidebar {
    width: 280px;
  }

  .chat-header {
    padding: 0.75rem;
  }

  .messages-container {
    padding: 0.5rem;
  }

  .message-input-area {
    padding: 0.75rem;
  }
}
</style>