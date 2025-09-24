import { defineStore } from 'pinia'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    currentUser: (state) => state.user
  },

  actions: {
    // Set axios default authorization header
    setAuthHeader(token) {
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      } else {
        delete axios.defaults.headers.common['Authorization']
      }
    },

    // Initialize auth state from localStorage
    initializeAuth() {
      if (this.token) {
        this.setAuthHeader(this.token)
        this.fetchProfile()
      }
    },

    // Register new user
    async register(userData) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/register`, userData)
        
        if (response.data.success) {
          const { user, token } = response.data.data
          
          this.user = user
          this.token = token
          localStorage.setItem('token', token)
          this.setAuthHeader(token)
          
          return { success: true, data: response.data.data }
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Registration failed'
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    // Login user
    async login(credentials) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials)
        
        if (response.data.success) {
          const { user, token } = response.data.data
          
          this.user = user
          this.token = token
          localStorage.setItem('token', token)
          this.setAuthHeader(token)
          
          return { success: true, data: response.data.data }
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Login failed'
        return { success: false, message: this.error }
      } finally {
        this.loading = false
      }
    },

    // Logout user
    async logout() {
      this.loading = true

      try {
        if (this.token) {
          await axios.post(`${API_BASE_URL}/auth/logout`)
        }
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        // Clear state regardless of API call success
        this.user = null
        this.token = null
        this.error = null
        localStorage.removeItem('token')
        this.setAuthHeader(null)
        this.loading = false
      }
    },

    // Fetch user profile
    async fetchProfile() {
      if (!this.token) return

      try {
        const response = await axios.get(`${API_BASE_URL}/auth/profile`)
        
        if (response.data.success) {
          this.user = response.data.data.user
        }
      } catch (error) {
        console.error('Fetch profile error:', error)
        // If token is invalid, logout
        if (error.response?.status === 401) {
          this.logout()
        }
      }
    },

    // Clear error
    clearError() {
      this.error = null
    }
  }
})