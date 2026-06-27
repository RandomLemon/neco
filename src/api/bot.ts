import axios from 'axios'
import { api } from './api'

const BOT_ROUTE_PREFIX = '/bots'

export interface BotTokenEntity {
  ID?: number
  CreatedAt?: string
  UpdatedAt?: string
  DeletedAt?: string | null

  id?: number
  created_at?: string
  updated_at?: string
  deleted_at?: string | null

  name: string
}

export interface BotConnection {
  session_id: string
  identifier: string
  token_id: number
  token_name: string
  connected: string
}

export interface BotDashboardStatus {
  online_count: number
  connections: BotConnection[]
  logs: string[]
}

export interface CreateBotTokenResult {
  record: BotTokenEntity | null
  secret: string | null
  error: string | null
}

const getErrorMessage = (error: unknown, fallback = '未知错误') => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined
    return data?.error || error.message || fallback
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}

const normalizeCreatedToken = (
  data: {
    token?: BotTokenEntity | string
    plain_token?: string
    secret?: string
    name?: string
    record?: BotTokenEntity
  },
  name: string,
): Omit<CreateBotTokenResult, 'error'> => {
  if (typeof data.token === 'string') {
    return {
      record: data.record || { name: data.name || name },
      secret: data.token,
    }
  }

  return {
    record: data.record || data.token || { name: data.name || name },
    secret: data.plain_token || data.secret || null,
  }
}

export const CreateBotToken = async (name: string): Promise<CreateBotTokenResult> => {
  try {
    const response = await api.post(`${BOT_ROUTE_PREFIX}/token`, { name })

    return {
      ...normalizeCreatedToken(response.data, name),
      error: null,
    }
  } catch (error) {
    return {
      record: null,
      secret: null,
      error: getErrorMessage(error, '创建 Bot Token 失败'),
    }
  }
}

export const GetBotTokenList = async (): Promise<BotTokenEntity[]> => {
  try {
    const response = await api.get(`${BOT_ROUTE_PREFIX}/token`)
    return response.data.tokens || []
  } catch {
    return []
  }
}

export const DeleteBotToken = async (name: string): Promise<string | null> => {
  try {
    await api.delete(`${BOT_ROUTE_PREFIX}/token/${encodeURIComponent(name)}`)
    return null
  } catch (error) {
    return getErrorMessage(error, '删除 Bot Token 失败')
  }
}

export const GetBotDashboardStatus = async (): Promise<BotDashboardStatus | null> => {
  try {
    const response = await api.get(`${BOT_ROUTE_PREFIX}/status`)
    const data = response.data as Partial<BotDashboardStatus>

    return {
      online_count: data.online_count || 0,
      connections: data.connections || [],
      logs: data.logs || [],
    }
  } catch {
    return null
  }
}

export const KickBotConnection = async (sessionId: string): Promise<string | null> => {
  try {
    await api.delete(`${BOT_ROUTE_PREFIX}/ws/kick/${encodeURIComponent(sessionId)}`)
    return null
  } catch (error) {
    return getErrorMessage(error, '踢出 Bot 连接失败')
  }
}
