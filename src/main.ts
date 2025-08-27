import { createApp } from 'vue'
import './style.css'
import './font/DefineFont.css'
import App from './App.vue'
import 'md-editor-v3/lib/style.css'
import Toast from "vue-toastification"
import "vue-toastification/dist/index.css"
import { router } from './router'

import './theme-override/md-preview.css'
import './theme-override/toast.css'

const app = createApp(App)

app.use(router)
app.use(Toast, {
  transition: "Vue-Toastification__bounce",
  maxToasts: 20,
  newestOnTop: true,
})

app.mount('#app')
