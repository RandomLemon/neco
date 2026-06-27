<script lang="ts" setup>
import {
  CreateBotToken,
  DeleteBotToken,
  GetBotDashboardStatus,
  GetBotTokenList,
  KickBotConnection,
  type BotConnection,
  type BotDashboardStatus,
  type BotTokenEntity,
  type CreateBotTokenResult,
} from '@/api/bot'
import MinecraftButtonClassic from '@/components/utils/MinecraftButtonClassic.vue'
import MinecraftDialog from '@/components/utils/MinecraftDialog.vue'
import MinecraftInput from '@/components/utils/MinecraftInput.vue'
import MinecraftSwitch from '@/components/utils/MinecraftSwitch.vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'

const toast = useToast()

const userGroup = ref<string[]>(JSON.parse(localStorage.getItem('userGroup') || '[]'))

const canManageBot = computed(() => {
  return userGroup.value.includes('admin') || userGroup.value.includes('bot_admin')
})

const status = ref<BotDashboardStatus>({
  online_count: 0,
  connections: [],
  logs: [],
})

const tokens = ref<BotTokenEntity[]>([])
const tokenName = ref('')
const createdToken = ref<CreateBotTokenResult | null>(null)

const isLoadingStatus = ref(false)
const isLoadingTokens = ref(false)
const autoRefresh = ref(false)
const liveMessage = ref('')

const deleteTokenDialogVisible = ref(false)
const pendingDeleteTokenName = ref('')

const kickConnectionDialogVisible = ref(false)
const pendingKickConnection = ref<BotConnection | null>(null)

let refreshTimer: ReturnType<typeof setInterval> | undefined

const visibleLogs = computed(() => {
  return [...status.value.logs].reverse()
})

const tokenNameValidationMessage = computed(() => {
  const name = tokenName.value.trim()

  if (name.length === 0) return 'Token 名称不能为空。'
  if (name.length > 64) return 'Token 名称不能超过 64 个字符。'

  if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
    return '仅允许英文字母、数字、点、下划线与连字符。'
  }

  return ''
})

const wsEndpoint = computed(() => {
  if (typeof window === 'undefined') {
    return '/necore/bots/ws/updates'
  }

  return `${window.location.origin}/necore/bots/ws/updates`
})

const escapeHtml = (value: string) => {
  return value.replace(/[&<>'"]/g, (char) => {
    const replacements: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    }

    return replacements[char]
  })
}

const stripHtml = (html: string) => {
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]*>/g, '')
  }

  const template = document.createElement('template')
  template.innerHTML = html
  return template.content.textContent || ''
}

const sanitizeLogHtml = (html: string) => {
  if (typeof document === 'undefined') {
    return escapeHtml(stripHtml(html))
  }

  const template = document.createElement('template')
  template.innerHTML = html

  const serialize = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return escapeHtml(node.textContent || '')
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return ''
    }

    const element = node as HTMLElement
    const children = Array.from(element.childNodes).map(serialize).join('')

    if (element.tagName.toLowerCase() !== 'span') {
      return children
    }

    const color =
      element.style.color || element.getAttribute('style')?.match(/color:\s*([^;]+)/)?.[1]

    if (color && /^#[0-9a-fA-F]{3,8}$/.test(color.trim())) {
      return `<span style="color: ${color.trim()};">${children}</span>`
    }

    return children
  }

  return Array.from(template.content.childNodes).map(serialize).join('')
}

const formatDateTime = (value?: string) => {
  if (!value) return '未知'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value.replace('T', ' ').slice(0, 19)
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

const getTokenId = (token: BotTokenEntity) => {
  return token.ID ?? token.id ?? '-'
}

const getTokenCreatedAt = (token: BotTokenEntity) => {
  return token.CreatedAt ?? token.created_at
}

const copyToClipboard = async (content: string, successMessage: string) => {
  try {
    await navigator.clipboard.writeText(content)
    toast.success(successMessage)
  } catch {
    toast.error('复制失败，请手动选择复制。')
  }
}

const refreshStatus = async () => {
  if (!canManageBot.value) return

  isLoadingStatus.value = true
  const result = await GetBotDashboardStatus()
  isLoadingStatus.value = false

  if (!result) {
    toast.error('获取机器人连接状态失败！')
    liveMessage.value = '获取机器人连接状态失败。'
    return
  }

  status.value = result
  liveMessage.value = `机器人连接状态已刷新，当前 ${result.online_count} 个连接在线。`
}

const refreshTokens = async () => {
  if (!canManageBot.value) return

  isLoadingTokens.value = true
  tokens.value = await GetBotTokenList()
  isLoadingTokens.value = false
}

const refreshAll = async () => {
  await Promise.all([refreshStatus(), refreshTokens()])
}

const onCreateToken = async () => {
  if (tokenNameValidationMessage.value !== '') {
    toast.warning(tokenNameValidationMessage.value)
    return
  }

  const result = await CreateBotToken(tokenName.value.trim())
  createdToken.value = result

  if (result.error) {
    toast.error(`创建 Bot Token 失败：${result.error}`)
    return
  }

  toast.success('Bot Token 已创建！')
  tokenName.value = ''
  liveMessage.value = 'Bot Token 已创建。'
  await refreshTokens()
}

const openDeleteTokenDialog = (name: string) => {
  pendingDeleteTokenName.value = name
  deleteTokenDialogVisible.value = true
}

const onConfirmDeleteToken = async () => {
  if (pendingDeleteTokenName.value.trim() === '') return

  const result = await DeleteBotToken(pendingDeleteTokenName.value)

  if (!result) {
    toast.success('Bot Token 已删除！')
    liveMessage.value = `Bot Token ${pendingDeleteTokenName.value} 已删除。`
    pendingDeleteTokenName.value = ''
    await Promise.all([refreshTokens(), refreshStatus()])
  } else {
    toast.error(`删除 Bot Token 失败：${result}`)
  }
}

const openKickConnectionDialog = (connection: BotConnection) => {
  pendingKickConnection.value = connection
  kickConnectionDialogVisible.value = true
}

const onConfirmKickConnection = async () => {
  if (!pendingKickConnection.value) return

  const result = await KickBotConnection(pendingKickConnection.value.session_id)

  if (!result) {
    toast.success('机器人连接已踢出！')
    liveMessage.value = `机器人连接 ${pendingKickConnection.value.identifier} 已踢出。`
    pendingKickConnection.value = null
    await refreshStatus()
  } else {
    toast.error(`踢出连接失败：${result}`)
  }
}

const startAutoRefresh = () => {
  if (refreshTimer) return
  refreshTimer = setInterval(refreshStatus, 10000)
}

const stopAutoRefresh = () => {
  if (!refreshTimer) return

  clearInterval(refreshTimer)
  refreshTimer = undefined
}

watch(autoRefresh, (enabled) => {
  if (enabled) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
})

onMounted(async () => {
  await refreshAll()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<template>
  <div class="management-tab-title-container">
    <h1 class="management-tab-title">机器人连接</h1>
    <span class="management-tab-subtitle">红石信号在线吗？</span>
  </div>

  <p class="sr-only" aria-live="polite">{{ liveMessage }}</p>

  <section v-if="!canManageBot" class="management-tab-form" aria-labelledby="bot-permission-title">
    <h2 id="bot-permission-title" class="management-tab-form-title">权限不足</h2>
    <p class="bot-help-text">
      只有超级管理员或拥有 <code>bot_admin</code> 权限的账号可以配置机器人连接并查看连接状态。
    </p>
  </section>

  <template v-else>
    <section class="bot-summary-grid" aria-label="机器人连接状态概览">
      <div class="bot-summary-card" role="status" aria-live="polite">
        <span class="bot-summary-label">在线连接</span>
        <strong class="bot-summary-value">{{ status.online_count }}</strong>
      </div>

      <div class="bot-summary-card">
        <span class="bot-summary-label">Token 数量</span>
        <strong class="bot-summary-value">{{ tokens.length }}</strong>
      </div>

      <div class="bot-summary-card">
        <span class="bot-summary-label">日志条数</span>
        <strong class="bot-summary-value">{{ status.logs.length }}</strong>
      </div>
    </section>

    <section class="management-tab-form" aria-labelledby="bot-control-title">
      <div class="bot-form-header">
        <div>
          <h2 id="bot-control-title" class="management-tab-form-title">状态控制台</h2>
          <p class="bot-help-text">刷新当前机器人连接、启用自动刷新，或复制客户端连接地址。</p>
        </div>

        <div class="bot-control-actions">
          <MinecraftButtonClassic class="bot-control-button" @click="refreshAll">
            {{ isLoadingStatus || isLoadingTokens ? '刷新中...' : '刷新全部' }}
          </MinecraftButtonClassic>

          <div class="bot-switch-row">
            <MinecraftSwitch id="bot-auto-refresh-switch" v-model="autoRefresh" />
            <label for="bot-auto-refresh-switch">每 10 秒刷新状态</label>
          </div>
        </div>
      </div>

      <div class="bot-endpoint-card" aria-labelledby="bot-ws-endpoint-title">
        <h3 id="bot-ws-endpoint-title" class="bot-card-title">客户端连接信息</h3>

        <dl class="bot-definition-list">
          <div>
            <dt>WebSocket 地址</dt>
            <dd>
              <code>{{ wsEndpoint }}</code>
              <MinecraftButtonClassic
                class="bot-inline-button"
                @click="copyToClipboard(wsEndpoint, 'WebSocket 地址已复制！')"
              >
                复制
              </MinecraftButtonClassic>
            </dd>
          </div>

          <div>
            <dt>鉴权 Header</dt>
            <dd><code>Authorization: Bearer &lt;bot-token&gt;</code></dd>
          </div>
        </dl>

        <p class="bot-warning-text">
          注意：当前后端创建接口如果没有返回明文 Token，前端只能管理 Token
          记录，无法补显已生成的密钥原文。
        </p>
      </div>
    </section>

    <section class="management-tab-form" aria-labelledby="bot-token-title">
      <div class="bot-form-header">
        <div>
          <h2 id="bot-token-title" class="management-tab-form-title">Bot Token 配置</h2>
          <p class="bot-help-text">创建或删除机器人连接密钥记录。名称用于识别连接来源。</p>
        </div>
      </div>

      <form
        class="bot-create-form"
        aria-describedby="bot-token-name-help"
        @submit.prevent="onCreateToken"
      >
        <div class="bot-input-group">
          <label class="bot-input-label" for="bot-token-name-input">Token 名称</label>

          <MinecraftInput
            id="bot-token-name-input"
            class="bot-input"
            v-model="tokenName"
            placeholder="例如 production-bot"
            autocomplete="off"
            :aria-invalid="tokenName.trim() !== '' && tokenNameValidationMessage !== ''"
            aria-describedby="bot-token-name-help"
          />

          <p id="bot-token-name-help" class="bot-help-text">
            1-64 个字符；仅支持英文字母、数字、点、下划线与连字符。
          </p>
        </div>

        <MinecraftButtonClassic class="bot-submit-button" native-type="submit">
          创建 Token
        </MinecraftButtonClassic>
      </form>

      <div v-if="createdToken && !createdToken.error" class="bot-created-token" role="status">
        <h3 class="bot-card-title">刚创建的 Token</h3>

        <p v-if="createdToken.secret" class="bot-help-text" style="color: #f56c6c">
          明文 Token 只会显示一次，请立即复制并保存。
        </p>

        <p v-else class="bot-warning-text">
          后端没有返回明文 Token；记录已创建，但本页面无法展示连接密钥。
        </p>

        <div v-if="createdToken.secret" class="bot-secret-row">
          <code>{{ createdToken.secret }}</code>

          <MinecraftButtonClassic
            class="bot-inline-button"
            @click="copyToClipboard(createdToken.secret, 'Bot Token 已复制！')"
          >
            复制
          </MinecraftButtonClassic>
        </div>
      </div>

      <div class="bot-table-wrap">
        <table class="bot-table">
          <caption>
            已配置的 Bot Token 列表
          </caption>

          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">名称</th>
              <th scope="col">创建时间</th>
              <th scope="col">操作</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="tokens.length === 0">
              <td colspan="4">暂无 Token 记录。</td>
            </tr>

            <tr v-for="token in tokens" :key="token.name">
              <td>{{ getTokenId(token) }}</td>
              <td>{{ token.name }}</td>
              <td>{{ formatDateTime(getTokenCreatedAt(token)) }}</td>
              <td>
                <MinecraftButtonClassic
                  class="bot-table-button danger"
                  :aria-label="`删除 Bot Token ${token.name}`"
                  @click="openDeleteTokenDialog(token.name)"
                >
                  删除
                </MinecraftButtonClassic>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="management-tab-form" aria-labelledby="bot-connection-title">
      <div class="bot-form-header">
        <div>
          <h2 id="bot-connection-title" class="management-tab-form-title">在线连接</h2>
          <p class="bot-help-text">查看当前 WebSocket 会话，并在需要时强制断开异常连接。</p>
        </div>

        <MinecraftButtonClassic class="bot-control-button" @click="refreshStatus">
          {{ isLoadingStatus ? '刷新中...' : '刷新状态' }}
        </MinecraftButtonClassic>
      </div>

      <div class="bot-table-wrap">
        <table class="bot-table">
          <caption>
            当前在线的机器人连接
          </caption>

          <thead>
            <tr>
              <th scope="col">机器人标识</th>
              <th scope="col">Token</th>
              <th scope="col">连接时间</th>
              <th scope="col">会话</th>
              <th scope="col">操作</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="status.connections.length === 0">
              <td colspan="5">当前没有在线机器人。</td>
            </tr>

            <tr v-for="connection in status.connections" :key="connection.session_id">
              <td>{{ connection.identifier || '未命名机器人' }}</td>
              <td>{{ connection.token_name }}</td>
              <td>{{ connection.connected }}</td>
              <td>
                <code>{{ connection.session_id.slice(0, 8) }}...</code>
              </td>
              <td>
                <MinecraftButtonClassic
                  class="bot-table-button danger"
                  :aria-label="`踢出机器人 ${connection.identifier || connection.session_id}`"
                  @click="openKickConnectionDialog(connection)"
                >
                  踢出
                </MinecraftButtonClassic>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="management-tab-form" aria-labelledby="bot-log-title">
      <h2 id="bot-log-title" class="management-tab-form-title">连接日志</h2>

      <div class="bot-log-list" role="log" aria-live="polite" aria-relevant="additions text">
        <p v-if="visibleLogs.length === 0" class="bot-empty-text">暂无连接日志。</p>

        <article
          v-for="(log, index) in visibleLogs"
          :key="`${index}-${log}`"
          class="bot-log-item"
          tabindex="0"
          :aria-label="stripHtml(log)"
        >
          <span aria-hidden="true" v-html="sanitizeLogHtml(log)"></span>
          <span class="sr-only">{{ stripHtml(log) }}</span>
        </article>
      </div>
    </section>
  </template>

  <MinecraftDialog
    title="删除 Bot Token"
    v-model="deleteTokenDialogVisible"
    @confirm="onConfirmDeleteToken"
  >
    <div class="bot-dialog-content">
      <p>
        确定要删除 <strong>{{ pendingDeleteTokenName }}</strong> 吗？
      </p>

      <p class="bot-warning-text">使用该 Token 的机器人将无法继续通过鉴权。</p>
    </div>
  </MinecraftDialog>

  <MinecraftDialog
    title="踢出机器人连接"
    v-model="kickConnectionDialogVisible"
    @confirm="onConfirmKickConnection"
  >
    <div class="bot-dialog-content">
      <p>
        确定要踢出
        <strong>{{
          pendingKickConnection?.identifier || pendingKickConnection?.session_id
        }}</strong>
        吗？
      </p>

      <p class="bot-warning-text">客户端如果配置了重连，稍后可能再次上线。</p>
    </div>
  </MinecraftDialog>
</template>

<style lang="css" scoped>
.bot-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 1rem;
}

.bot-summary-card,
.bot-endpoint-card,
.bot-created-token {
  padding: 1rem;
  background-color: #2e2e2e;
  border: 2px solid #1a1a1a;
  box-shadow:
    inset -2px -2px 0 0 #1f1f1f,
    inset 2px 2px 0 0 #454545;
}

.bot-summary-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.bot-summary-label,
.bot-help-text,
.bot-empty-text {
  color: rgba(255, 255, 255, 0.76);
}

.bot-summary-label {
  font-size: 0.95rem;
}

.bot-summary-value {
  color: #fff;
  font-size: 2.2rem;
  line-height: 1;
}

.bot-form-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.bot-control-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.bot-control-button,
.bot-submit-button {
  width: 10rem;
}

.bot-switch-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #fff;
  user-select: none;
}

.bot-endpoint-card,
.bot-created-token {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.bot-card-title {
  margin: 0;
  color: #fff;
  font-size: 1.2rem;
}

.bot-definition-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 0;
}

.bot-definition-list div {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.bot-definition-list dt,
.bot-input-label {
  color: #fff;
  user-select: none;
}

.bot-definition-list dd {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin: 0;
}

.bot-warning-text {
  margin: 0;
  color: #f0c36a;
}

.bot-create-form {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  flex-wrap: wrap;
}

.bot-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: min(100%, 18rem);
}

.bot-input {
  min-width: 16rem;
  width: 100%;
}

.bot-help-text {
  margin: 0;
}

.bot-secret-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.bot-inline-button,
.bot-table-button {
  width: 5rem;
  min-width: 5rem;
}

.bot-table-wrap {
  overflow-x: auto;
  border: 2px solid #1a1a1a;
}

.bot-table {
  width: 100%;
  min-width: 42rem;
  border-collapse: collapse;
  background-color: #303030;
}

.bot-table caption {
  text-align: left;
  color: #fff;
  padding: 0.75rem;
  background-color: #242424;
  border-bottom: 2px solid #1a1a1a;
}

.bot-table th,
.bot-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #555;
  vertical-align: middle;
}

.bot-table th {
  color: #fff;
  background-color: #3c3c3c;
}

.bot-table tr:hover td {
  background-color: rgba(255, 255, 255, 0.04);
}

.bot-table-button.danger :deep(.title) {
  color: #ffd7d7;
}

.bot-log-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 20rem;
  overflow-y: auto;
  padding: 0.5rem;
  background-color: #202020;
  border: 2px solid #111;
}

.bot-log-item {
  padding: 0.5rem;
  color: #eee;
  background-color: #2d2d2d;
  border-left: 4px solid var(--minecraft-green-light);
  overflow-wrap: anywhere;
}

.bot-log-item:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 3px;
}

.bot-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.bot-dialog-content p {
  margin: 0;
}

code {
  display: inline-block;
  max-width: 100%;
  padding: 0.15rem 0.35rem;
  color: #c6f6b6;
  background-color: #181818;
  border: 1px solid #555;
  overflow-wrap: anywhere;
}

@media screen and (max-width: 768px) {
  .bot-form-header,
  .bot-create-form {
    flex-direction: column;
    align-items: stretch;
  }

  .bot-control-actions {
    justify-content: flex-start;
  }

  .bot-control-button,
  .bot-submit-button {
    width: 100%;
  }
}
</style>
