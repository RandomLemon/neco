import { api } from './api'
import { useToast } from 'vue-toastification'

const toast = useToast()

export interface UserEntity {
  username: string,
  group: Array<string>,
  department: Array<string>
}

export type UserStatus = "alive" | "dead" | "unknown"

export const LoginStatus = async (): Promise<string> => {
  let result: UserStatus = "unknown"
  await api
    .get(`/auth/status`)
    .then((response) => {
      result = response.data.status
    })
    .catch((e) => {
      toast.error(`请求错误：${e}`)
    })
  return result
}

export const authorized = async () => {
  let status = await LoginStatus()
  return !(localStorage.getItem('token') == '') && status == "alive"
}

export interface LoginEntity {
  token?: string,
  user?: UserEntity,
  error?: string
}

export const Login = async (username: string, password: string): Promise<LoginEntity | null> => {
  let result: LoginEntity | null = null
  await api
    .post(`/auth/login`, {
      username: username,
      password: password,
    })
    .then((response) => {
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('username', response.data.user)
      result = response.data as LoginEntity
    })
    .catch((e) => {
      toast.error(`请求错误：${e}`)
    })
  return result
}

export const CreateUser = async (username: string, password: string): Promise<string | null> => {
  let result: string | null = null
  await api
    .post(`/auth/register`, {
      username: username,
      password: password,
    })
    .then((response) => {
      if (response.data.error) {
        result = response.data.error
      }
    })
    .catch((e) => {
      toast.error(`请求错误：${e}`)
    })
  return result
}
