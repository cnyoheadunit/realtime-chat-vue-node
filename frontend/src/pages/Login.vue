<template>
  <div class="login-container">
    <div class="login-card">
      <Card>
        <template #header>
          <div class="card-header">
            <i class="pi pi-sign-in text-4xl text-primary"></i>
            <h2>Welcome Back</h2>
            <p class="text-muted">Sign in to your account to continue</p>
          </div>
        </template>

        <template #content>
          <form @submit.prevent="handleLogin" class="login-form">
            <div class="field">
              <label for="username" class="block text-900 font-medium mb-2">
                Username
              </label>
              <InputText
                id="username"
                v-model="loginForm.username"
                placeholder="Enter your username"
                class="w-full"
                :class="{ 'p-invalid': errors.username }"
                @blur="validateUsername"
              />
              <small v-if="errors.username" class="p-error">
                {{ errors.username }}
              </small>
            </div>

            <div class="field">
              <label for="password" class="block text-900 font-medium mb-2">
                Password
              </label>
              <Password
                id="password"
                v-model="loginForm.password"
                placeholder="Enter your password"
                class="w-full"
                :class="{ 'p-invalid': errors.password }"
                :feedback="false"
                toggleMask
                @blur="validatePassword"
              />
              <small v-if="errors.password" class="p-error">
                {{ errors.password }}
              </small>
            </div>

            <Button
              type="submit"
              label="Sign In"
              class="w-full mt-3"
              :loading="authStore.loading"
              :disabled="!isFormValid || authStore.loading"
            />

            <Divider align="center" type="solid" class="my-4">
              <span class="text-muted">OR</span>
            </Divider>

            <div class="text-center">
              <span class="text-muted">Don't have an account? </span>
              <router-link to="/register" class="text-primary font-medium">
                Sign up here
              </router-link>
            </div>
          </form>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// Reactive form data
const loginForm = reactive({
  username: '',
  password: ''
})

// Form validation errors
const errors = reactive({
  username: '',
  password: ''
})

// Computed properties
const isFormValid = computed(() => {
  return loginForm.username.length >= 3 && 
         loginForm.password.length >= 6 && 
         !errors.username && 
         !errors.password
})

// Validation functions
const validateUsername = () => {
  if (!loginForm.username) {
    errors.username = 'Username is required'
  } else if (loginForm.username.length < 3) {
    errors.username = 'Username must be at least 3 characters'
  } else {
    errors.username = ''
  }
}

const validatePassword = () => {
  if (!loginForm.password) {
    errors.password = 'Password is required'
  } else if (loginForm.password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
  } else {
    errors.password = ''
  }
}

// Handle login submission
const handleLogin = async () => {
  // Validate all fields
  validateUsername()
  validatePassword()

  if (!isFormValid.value) return

  try {
    const result = await authStore.login({
      username: loginForm.username.trim(),
      password: loginForm.password
    })

    if (result.success) {
      toast.add({
        severity: 'success',
        summary: 'Login Successful',
        detail: `Welcome back, ${result.data.user.username}!`,
        life: 3000
      })
      
      router.push('/chat')
    } else {
      toast.add({
        severity: 'error',
        summary: 'Login Failed',
        detail: result.message,
        life: 5000
      })
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Login Error',
      detail: 'An unexpected error occurred',
      life: 5000
    })
  }
}

// Clear any previous errors when component mounts
onMounted(() => {
  authStore.clearError()
})
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 100%);
  padding: 1rem;
}

.login-card {
  width: 100%;
  max-width: 400px;
}

.card-header {
  text-align: center;
  padding: 2rem 2rem 0;
}

.card-header h2 {
  margin: 1rem 0 0.5rem;
  color: var(--text-color);
}

.card-header p {
  margin: 0;
  color: var(--text-color-secondary);
}

.login-form {
  padding: 0 2rem 2rem;
}

.field {
  margin-bottom: 1.5rem;
}

.field:last-child {
  margin-bottom: 0;
}

.p-error {
  display: block;
  margin-top: 0.25rem;
}

.text-muted {
  color: var(--text-color-secondary);
}

@media (max-width: 480px) {
  .login-container {
    padding: 0.5rem;
  }
  
  .card-header {
    padding: 1.5rem 1rem 0;
  }
  
  .login-form {
    padding: 0 1rem 1.5rem;
  }
}
</style>