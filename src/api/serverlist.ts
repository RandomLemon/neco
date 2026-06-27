import { api } from './api'

export interface ServerPlayer {
  name: string
  uuid?: string
}

export interface ServerStatus {
  icon?: string
  online?: boolean
  latency?: number
  version?: string
  playerCount?: number
  capacity?: number
  players?: ServerPlayer[]
}

export interface ServerEntity {
  id: string
  name: string
  icon: string
  description: string
  onlineMapUrl: string
  realtime: boolean
  serverUrl: string

  status?: ServerStatus
}

export const GetServerList = async (): Promise<ServerEntity[]> => {
  let result: ServerEntity[] = []
  await api
    .get('/server')
    .then((res) => {
      result = res.data.servers as ServerEntity[]
    })
    .catch(() => {})
  return result
}

export const GetServerStatus = async (url: string): Promise<ServerStatus | null> => {
  let result: ServerStatus | null = null
  await api
    .post('/server/status', {
      serverUrl: url,
    })
    .then((res) => {
      result = res.data as ServerStatus
    })
    .catch(() => {})
  return result
}

export const CreateServer = async (): Promise<string | null> => {
  let result: string | null = null
  await api
    .get(`/server/create`)
    .then((res) => {
      if (res.data.id) {
        result = res.data.id as string
      }
    })
    .catch(() => {})
  return result
}

export const UpdateServer = async (server: ServerEntity): Promise<string | null> => {
  let result: string | null = null
  await api
    .patch('/server', server)
    .then((res) => {
      if (res.data.error) {
        result = res.data.error as string
      }
    })
    .catch((err) => {
      if (err.response && err.response.data.error) {
        result = err.response.data.error as string
      }
    })
  return result
}

export const DeleteServer = async (id: string): Promise<string | null> => {
  let result: string | null = null
  await api
    .delete(`/server/${id}`)
    .then((res) => {
      if (res.data.error) {
        result = res.data.error as string
      }
    })
    .catch((err) => {
      if (err.response && err.response.data.error) {
        result = err.response.data.error as string
      }
    })
  return result
}
