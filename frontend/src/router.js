import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from './stores/auth'

// Import pages
import Login from './pages/Login.vue'
import Register from './pages/Register.vue'
import Chat from './pages/Chat.vue'

const routes = [
  {
    path: '/',
    redirect: '/chat'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { requiresGuest: true }
  },
  {
    path: '/chat',
    name: 'Chat',
    component: Chat,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated

  if (to.meta.requiresAuth && !isAuthenticated) {
    // Redirect to login if route requires authentication and user is not authenticated
    next('/login')
  } else if (to.meta.requiresGuest && isAuthenticated) {
    // Redirect to chat if route requires guest and user is authenticated
    next('/chat')
  } else {
    next()
  }
})

export default router