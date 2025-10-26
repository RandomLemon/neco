import { api } from './api'

export interface ServerStatus {
  online?: boolean
  latency?: number
  version?: string
  playerCount?: number
  capacity?: number
}

export interface ServerEntity {
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
      serverUrl: url
    })
    .then((res) => {
      result = res.data as ServerStatus
    })
    .catch(() => {})
  return result
}

export const AddServer = async (server: ServerEntity): Promise<string | null> => {
  let result: string | null = null
  await api
    .post('/server', server)
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

export const DeleteServer = async (name: string): Promise<string | null> => {
  let result: string | null = null
  await api
    .delete(`/server/${name}`)
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
