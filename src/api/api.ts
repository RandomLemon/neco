import axios from 'axios'

export const api = axios.create({
  baseURL: '/necore',
  timeout: 10000,
})

api.interceptors.request.use(
  (config) => {
    if (!(localStorage.getItem('token') == '')) {
      config.headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`
    }
    return config
  },
  (error) => {
    console.log(error)
    return Promise.reject(error)
  },
)
