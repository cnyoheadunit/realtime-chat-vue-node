import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'

// PrimeVue components
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Card from 'primevue/card'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'
import Avatar from 'primevue/avatar'
import Badge from 'primevue/badge'
import Divider from 'primevue/divider'
import ScrollPanel from 'primevue/scrollpanel'
import Textarea from 'primevue/textarea'
import DataView from 'primevue/dataview'

// PrimeIcons
import 'primeicons/primeicons.css'

import './style.css'
import App from './App.vue'

const app = createApp(App)

// Setup Pinia store
app.use(createPinia())

// Setup Vue Router
app.use(router)

// Setup PrimeVue
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.dark'
    }
  }
})

// Setup PrimeVue services
app.use(ToastService)
app.use(ConfirmationService)

// Register PrimeVue components globally
app.component('Button', Button)
app.component('InputText', InputText)
app.component('Password', Password)
app.component('Card', Card)
app.component('Toast', Toast)
app.component('ProgressSpinner', ProgressSpinner)
app.component('Avatar', Avatar)
app.component('Badge', Badge)
app.component('Divider', Divider)
app.component('ScrollPanel', ScrollPanel)
app.component('Textarea', Textarea)
app.component('DataView', DataView)

app.mount('#app')
