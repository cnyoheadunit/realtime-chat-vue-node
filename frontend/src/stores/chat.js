import { defineStore } from 'pinia'
import { io } from 'socket.io-client'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'

export const useChatStore = defineStore('chat', {
  state: () => ({
    socket: null,
    connected: false,
    messages: [],
    users: [],
    onlineUsers: [],
    currentChatUser: null,
    typing: {},
    loading: false,
    error: null,
    unreadCount: 0
  }),

  getters: {
    isConnected: (state) => state.connected,
    currentMessages: (state) => {
      if (!state.currentChatUser) return []
      
      return state.messages.filter(msg => 
        (msg.senderId === state.currentChatUser.id) ||
        (msg.receiverId === state.currentChatUser.id)
      ).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    },
    
    isUserOnline: (state) => (userId) => {
      return state.onlineUsers.some(user => user.id === userId)
    },

    isUserTyping: (state) => (userId) => {
      return state.typing[userId] || false
    }
  },

  actions: {
    // Initialize socket connection
    connectSocket(token) {
      if (this.socket?.connected) return

      this.socket = io(SOCKET_URL, {
        auth: { token },
        autoConnect: false
      })

      // Connection events
      this.socket.on('connect', () => {
        this.connected = true
        console.log('✅ Connected to socket server')
      })

      this.socket.on('disconnect', () => {
        this.connected = false
        console.log('❌ Disconnected from socket server')
      })

      this.socket.on('connect_error', (error) => {
        this.error = 'Socket connection failed: ' + error.message
        console.error('Socket connection error:', error)
      })

      // Chat events
      this.socket.on('receive_message', (message) => {
        this.addMessage(message)
      })

      this.socket.on('users_online', (users) => {
        this.onlineUsers = users
      })

      this.socket.on('user_typing', ({ userId, username, isTyping }) => {
        this.typing = { ...this.typing, [userId]: isTyping }
        
        // Clear typing indicator after 3 seconds
        if (isTyping) {
          setTimeout(() => {
            this.typing = { ...this.typing, [userId]: false }
          }, 3000)
        }
      })

      this.socket.on('new_message_notification', (notification) => {
        // Handle new message notifications
        console.log('New message notification:', notification)
        // You can add toast notification here
      })

      this.socket.on('messages_read', ({ readBy, readByUsername }) => {
        // Mark messages as read in the UI
        this.markMessagesAsRead(readBy)
      })

      this.socket.on('error', (error) => {
        this.error = error.message
        console.error('Socket error:', error)
      })

      // Connect the socket
      this.socket.connect()
    },

    // Disconnect socket
    disconnectSocket() {
      if (this.socket) {
        this.socket.emit('user_logout')
        this.socket.disconnect()
        this.socket = null
        this.connected = false
      }
    },

    // Join chat room
    joinChat(receiverId) {
      if (this.socket?.connected) {
        this.socket.emit('join_chat', { receiverId })
      }
    },

    // Leave chat room
    leaveChat(receiverId) {
      if (this.socket?.connected) {
        this.socket.emit('leave_chat', { receiverId })
      }
    },

    // Send message via socket
    sendMessage(receiverId, message) {
      if (this.socket?.connected && message.trim()) {
        this.socket.emit('send_message', {
          receiverId,
          message: message.trim()
        })
      }
    },

    // Send typing indicator
    sendTyping(receiverId, isTyping) {
      if (this.socket?.connected) {
        this.socket.emit('typing', { receiverId, isTyping })
      }
    },

    // Mark messages as read
    markMessagesRead(senderId) {
      if (this.socket?.connected) {
        this.socket.emit('mark_messages_read', { senderId })
      }
    },

    // Add message to store
    addMessage(message) {
      // Check if message already exists to prevent duplicates
      const exists = this.messages.find(msg => msg.id === message.id)
      if (!exists) {
        this.messages.push(message)
      }
    },

    // Set current chat user
    setCurrentChatUser(user) {
      // Leave previous chat room
      if (this.currentChatUser) {
        this.leaveChat(this.currentChatUser.id)
      }

      // Set new chat user
      this.currentChatUser = user

      // Join new chat room
      if (user) {
        this.joinChat(user.id)
        this.loadChatHistory(user.id)
        this.markMessagesRead(user.id)
      }
    },

    // Load chat history from API
    async loadChatHistory(receiverId, page = 1) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.get(`${API_BASE_URL}/chat/history/${receiverId}`, {
          params: { page, limit: 50 }
        })

        if (response.data.success) {
          const { messages } = response.data.data
          
          // Clear existing messages for this conversation or merge
          if (page === 1) {
            this.messages = this.messages.filter(msg => 
              !(msg.senderId === receiverId || msg.receiverId === receiverId)
            )
          }

          // Add loaded messages
          messages.forEach(message => this.addMessage(message))
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to load chat history'
        console.error('Load chat history error:', error)
      } finally {
        this.loading = false
      }
    },

    // Load users list
    async loadUsers() {
      this.loading = true
      this.error = null

      try {
        const response = await axios.get(`${API_BASE_URL}/chat/users`)

        if (response.data.success) {
          this.users = response.data.data.users
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to load users'
        console.error('Load users error:', error)
      } finally {
        this.loading = false
      }
    },

    // Load unread messages count
    async loadUnreadCount() {
      try {
        const response = await axios.get(`${API_BASE_URL}/chat/unread-count`)

        if (response.data.success) {
          this.unreadCount = response.data.data.unreadCount
        }
      } catch (error) {
        console.error('Load unread count error:', error)
      }
    },

    // Mark messages as read in store
    markMessagesAsRead(senderId) {
      this.messages.forEach(message => {
        if (message.senderId === senderId && !message.isRead) {
          message.isRead = true
        }
      })
    },

    // Clear error
    clearError() {
      this.error = null
    },

    // Clear chat data
    clearChatData() {
      this.messages = []
      this.users = []
      this.onlineUsers = []
      this.currentChatUser = null
      this.typing = {}
      this.unreadCount = 0
    }
  }
})