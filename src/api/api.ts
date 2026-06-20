import axios from 'axios'
import { CheckAuthorized } from './auth'
import { createToastInterface } from 'vue-toastification'
import { router } from '@/router'

export const BASE_URL = '/necore'

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
})

const toast = createToastInterface({
  transition: 'Vue-Toastification__bounce',
  maxToasts: 20,
  newestOnTop: true,
  timeout: 3000,
})

api.interceptors.request.use(
  (config) => {
    if (!((localStorage.getItem('token') || '')?.trim() === '')) {
      config.headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`
    }
    return config
  },
  async (error) => {
    console.log(error)
    if (error.response.status === 401) {
      const result = await CheckAuthorized()
      if (!result) {
        toast.warning('登录状态已过期，请重新登录！')
        router.replace('/auth/login')
      }
    }
    return Promise.reject(error)
  },
)
