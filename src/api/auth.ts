import { api } from './api'
import { useToast } from 'vue-toastification'

const toast = useToast()

export interface UserTag {
  text: string
  color: string
  tagColor: string
}

export interface UserEntity {
  username: string
  avatar?: string
  group: Array<string> | null
  tags: Array<UserTag> | null
}

export type UserStatus = 'alive' | 'dead' | 'unknown'

export const LoginStatus = async (): Promise<string> => {
  let result: UserStatus = 'unknown'
  await api
    .get(`/auth/status`)
    .then((response) => {
      result = response.data.status
      if (result == 'dead') {
        localStorage.removeItem('token')
        localStorage.removeItem('username')
        localStorage.removeItem('userGroup')
        localStorage.removeItem('userTags')
      }
    })
    .catch(() => {})
  return result
}

export const CheckAuthorized = async () => {
  const status = await LoginStatus()
  return !(localStorage.getItem('token') == '') && status == 'alive'
}

export interface LoginEntity {
  token?: string
  user?: UserEntity
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
      console.log(response.data)
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('username', response.data.user?.username)
      localStorage.setItem('userGroup', JSON.stringify(response.data.user?.group || []))
      localStorage.setItem('userTags', JSON.stringify(response.data.user?.tags || []))
      result = response.data as LoginEntity
    })
    .catch((err) => {
      if (err.response.data.error) {
        result = err.response.data as LoginEntity
      }
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
      if (e.response.data.error) {
        result = e.response.data.error
      }
    })
  return result
}

export const GetUserInfo = async (username: string): Promise<UserEntity | null> => {
  let result: UserEntity | null = null
  await api
    .get(`/auth/user/${username}`)
    .then((response) => {
      result = response.data.user as UserEntity
    })
    .catch(() => {})
  return result
}

export const GetUserList = async (): Promise<Array<UserEntity> | null> => {
  let result: Array<UserEntity> | null = null
  await api
    .get(`/auth/userlist`)
    .then((response) => {
      result = response.data.users as Array<UserEntity>
    })
    .catch(() => {})
  return result
}

export const DeleteUser = async (username: string): Promise<string | null> => {
  let result: string | null = null
  await api
    .delete(`/auth/user/${username}`)
    .then((response) => {
      if (response.data.error) {
        result = response.data.error
      }
    })
    .catch((e) => {
      if (e.response.data.error) {
        result = e.response.data.error
      }
    })
  return result
}

export const UpdatePassword = async (
  username: string,
  selfPassword: string,
  password: string,
): Promise<string | null> => {
  let result: string | null = null
  await api
    .post(`/auth/password`, {
      id: username,
      self_password: selfPassword,
      new_password: password,
    })
    .then((response) => {
      if (response.data.error) {
        result = response.data.error
      }
    })
    .catch((e) => {
      if (e.response.data.error) {
        result = e.response.data.error
      }
    })
  return result
}

export const UpdateUserInfo = async (
  username: string,
  group: Array<string>,
  tags: Array<UserTag>,
): Promise<string | null> => {
  let result: string | null = null
  await api
    .patch(`/auth/user`, {
      username: username,
      group: group,
      tags: tags,
    })
    .then((response) => {
      if (response.data.error) {
        result = response.data.error
      }
    })
    .catch((e) => {
      if (e.response.data.error) {
        result = e.response.data.error
      }
    })
  if (localStorage.getItem('username') == username) {
    const userInfo = await GetUserInfo(username)
    if (userInfo) {
      localStorage.setItem('username', userInfo.username)
      localStorage.setItem('userGroup', JSON.stringify(userInfo.group))
      localStorage.setItem('userTags', JSON.stringify(userInfo.tags))
    } else {
      toast.error(`获取用户信息失败！`)
    }
  }
  return result
}

export const Logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('username')
  localStorage.removeItem('userGroup')
  localStorage.removeItem('userTags')
}

export const GetAvatar = async (username: string): Promise<string | null> => {
  let result: string | null = null
  await api
    .get(`/auth/avatar/${username}`)
    .then((response) => {
      result = response.data.avatar
    })
    .catch(() => {})
  return result
}

export const UpdateAvatar = async (username: string, avatar: string): Promise<string | null> => {
  let result: string | null = null
  await api
    .post(`/auth/avatar`, {
      username: username,
      avatar: avatar,
    })
    .then((response) => {
      if (response.data.error) {
        result = response.data.error
      }
    })
    .catch((e) => {
      if (e.response.data.error) {
        result = e.response.data.error
      }
    })
  return result
}
