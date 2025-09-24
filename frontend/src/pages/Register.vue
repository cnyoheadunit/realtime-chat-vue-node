<template>
  <div class="register-container">
    <div class="register-card">
      <Card>
        <template #header>
          <div class="card-header">
            <i class="pi pi-user-plus text-4xl text-primary"></i>
            <h2>Create Account</h2>
            <p class="text-muted">Sign up to start chatting with others</p>
          </div>
        </template>

        <template #content>
          <form @submit.prevent="handleRegister" class="register-form">
            <div class="field">
              <label for="username" class="block text-900 font-medium mb-2">
                Username
              </label>
              <InputText
                id="username"
                v-model="registerForm.username"
                placeholder="Choose a username"
                class="w-full"
                :class="{ 'p-invalid': errors.username }"
                @blur="validateUsername"
                @input="validateUsername"
              />
              <small v-if="errors.username" class="p-error">
                {{ errors.username }}
              </small>
              <small v-else class="text-muted">
                At least 3 characters, letters and numbers only
              </small>
            </div>

            <div class="field">
              <label for="password" class="block text-900 font-medium mb-2">
                Password
              </label>
              <Password
                id="password"
                v-model="registerForm.password"
                placeholder="Create a strong password"
                class="w-full"
                :class="{ 'p-invalid': errors.password }"
                :feedback="true"
                toggleMask
                @blur="validatePassword"
                @input="validatePassword"
              />
              <small v-if="errors.password" class="p-error">
                {{ errors.password }}
              </small>
            </div>

            <div class="field">
              <label for="confirmPassword" class="block text-900 font-medium mb-2">
                Confirm Password
              </label>
              <Password
                id="confirmPassword"
                v-model="registerForm.confirmPassword"
                placeholder="Confirm your password"
                class="w-full"
                :class="{ 'p-invalid': errors.confirmPassword }"
                :feedback="false"
                toggleMask
                @blur="validateConfirmPassword"
                @input="validateConfirmPassword"
              />
              <small v-if="errors.confirmPassword" class="p-error">
                {{ errors.confirmPassword }}
              </small>
            </div>

            <Button
              type="submit"
              label="Create Account"
              class="w-full mt-3"
              :loading="authStore.loading"
              :disabled="!isFormValid || authStore.loading"
            />

            <Divider align="center" type="solid" class="my-4">
              <span class="text-muted">OR</span>
            </Divider>

            <div class="text-center">
              <span class="text-muted">Already have an account? </span>
              <router-link to="/login" class="text-primary font-medium">
                Sign in here
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
const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})

// Form validation errors
const errors = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})

// Computed properties
const isFormValid = computed(() => {
  return registerForm.username.length >= 3 && 
         registerForm.password.length >= 6 && 
         registerForm.confirmPassword === registerForm.password &&
         !errors.username && 
         !errors.password && 
         !errors.confirmPassword
})

// Validation functions
const validateUsername = () => {
  const username = registerForm.username.trim()
  
  if (!username) {
    errors.username = 'Username is required'
  } else if (username.length < 3) {
    errors.username = 'Username must be at least 3 characters'
  } else if (username.length > 20) {
    errors.username = 'Username must be less than 20 characters'
  } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.username = 'Username can only contain letters, numbers, and underscores'
  } else {
    errors.username = ''
  }
}

const validatePassword = () => {
  const password = registerForm.password
  
  if (!password) {
    errors.password = 'Password is required'
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
  } else if (password.length > 50) {
    errors.password = 'Password must be less than 50 characters'
  } else {
    errors.password = ''
  }
  
  // Re-validate confirm password if it exists
  if (registerForm.confirmPassword) {
    validateConfirmPassword()
  }
}

const validateConfirmPassword = () => {
  if (!registerForm.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password'
  } else if (registerForm.confirmPassword !== registerForm.password) {
    errors.confirmPassword = 'Passwords do not match'
  } else {
    errors.confirmPassword = ''
  }
}

// Handle registration submission
const handleRegister = async () => {
  // Validate all fields
  validateUsername()
  validatePassword()
  validateConfirmPassword()

  if (!isFormValid.value) return

  try {
    const result = await authStore.register({
      username: registerForm.username.trim(),
      password: registerForm.password
    })

    if (result.success) {
      toast.add({
        severity: 'success',
        summary: 'Registration Successful',
        detail: `Welcome to the chat, ${result.data.user.username}!`,
        life: 3000
      })
      
      router.push('/chat')
    } else {
      toast.add({
        severity: 'error',
        summary: 'Registration Failed',
        detail: result.message,
        life: 5000
      })
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Registration Error',
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
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 100%);
  padding: 1rem;
}

.register-card {
  width: 100%;
  max-width: 450px;
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

.register-form {
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
  font-size: 0.875rem;
}

@media (max-width: 480px) {
  .register-container {
    padding: 0.5rem;
  }
  
  .card-header {
    padding: 1.5rem 1rem 0;
  }
  
  .register-form {
    padding: 0 1rem 1.5rem;
  }
}
</style>