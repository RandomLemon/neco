<script lang="ts" setup>
import useClipboard from 'vue-clipboard3'
import { useToast } from 'vue-toastification'
import { GetServerStatus, type ServerEntity, type ServerPlayer } from '../../api/serverlist'
import DeleteIcon from '@/components/icons/DeleteIcon.vue'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

const toast = useToast()
const { toClipboard } = useClipboard()

const copy = async (text: string) => {
  try {
    await toClipboard(text)
    toast.success('服务器链接已复制！')
  } catch {
    toast.warning('该服务器暂无链接！')
  }
}

const props = defineProps({
  pingIcon: {
    type: String,
    required: true,
  },
  withDelete: {
    type: Boolean,
    default: false,
  },
})

const server = defineModel('server', {
  type: Object as () => ServerEntity,
  required: true,
})

const emit = defineEmits(['delete'])

const playerListExpanded = ref(false)
const hoveredPlayerName = ref('')
const playerListScrollRef = ref<HTMLElement | null>(null)
const playerListWidth = ref(0)

const playerTooltipVisible = ref(false)
const playerTooltipName = ref('')
const playerTooltipStyle = ref<Record<string, string>>({})

let playerListResizeObserver: ResizeObserver | undefined

const normalizedPlayers = computed(() => {
  return server.value.status?.players || []
})

const PLAYER_CELL_SIZE = 40
const PLAYER_CELL_GAP = 8

const maxPlayersInOneRow = computed(() => {
  if (playerListWidth.value <= 0) {
    return normalizedPlayers.value.length
  }

  return Math.max(
    1,
    Math.floor((playerListWidth.value + PLAYER_CELL_GAP) / (PLAYER_CELL_SIZE + PLAYER_CELL_GAP)),
  )
})

const shouldUseTwoPlayerRows = computed(() => {
  if (!playerListExpanded.value) {
    return false
  }

  return normalizedPlayers.value.length > maxPlayersInOneRow.value
})

const canShowPlayerList = computed(() => {
  return (
    server.value.realtime &&
    server.value.status?.online === true &&
    normalizedPlayers.value.length > 0
  )
})

const playerListId = computed(() => {
  return `server-player-list-${server.value.id || server.value.name}`
})

const normalizeUuid = (uuid?: string) => {
  const value = uuid?.trim() || ''

  if (!value) {
    return ''
  }

  return value.replaceAll('-', '')
}

const getPlayerAvatarSources = (player: ServerPlayer) => {
  const uuid = normalizeUuid(player.uuid)
  const name = player.name.trim()

  const sources: string[] = []

  // 优先使用 MCHeads。它对正版 UUID 和玩家名都比较宽容。
  if (uuid) {
    sources.push(`https://mc-heads.net/avatar/${encodeURIComponent(uuid)}/32`)
  }

  if (name) {
    sources.push(`https://mc-heads.net/avatar/${encodeURIComponent(name)}/32`)
  }

  // Crafatar 只适合 UUID，不要拿玩家名去请求。
  if (uuid) {
    sources.push(
      `https://crafatar.com/avatars/${encodeURIComponent(uuid)}?size=32&overlay=true&default=MHF_Steve`,
    )
  }

  // Minotar 作为玩家名兜底。
  if (name) {
    sources.push(`https://minotar.net/avatar/${encodeURIComponent(name)}/32.png`)
    sources.push(`https://cravatar.eu/avatar/${encodeURIComponent(name)}/32.png`)
  }

  // 最终兜底。
  sources.push('https://mc-heads.net/avatar/MHF_Steve/32')

  return sources
}

const avatarUrl = (player: ServerPlayer) => {
  return getPlayerAvatarSources(player)[0]
}

const onAvatarError = (event: Event, player: ServerPlayer) => {
  const img = event.target as HTMLImageElement
  const currentIndex = Number(img.dataset.avatarIndex || '0')
  const sources = getPlayerAvatarSources(player)
  const nextIndex = currentIndex + 1

  if (nextIndex < sources.length) {
    img.dataset.avatarIndex = String(nextIndex)
    img.src = sources[nextIndex]
  }
}

const showPlayerTooltip = (playerName: string, event: Event) => {
  hoveredPlayerName.value = playerName
  playerTooltipName.value = playerName

  const target = event.currentTarget as HTMLElement | null

  if (!target) {
    playerTooltipVisible.value = false
    return
  }

  const rect = target.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2

  // tooltip 最大宽度约 16rem，这里用 136px 做半宽估算，避免贴近屏幕左右边时被截断。
  const tooltipHalfWidth = 136
  const safePadding = 8
  const minLeft = tooltipHalfWidth + safePadding
  const maxLeft = Math.max(minLeft, window.innerWidth - tooltipHalfWidth - safePadding)

  const left = Math.min(Math.max(centerX, minLeft), maxLeft)

  let top = rect.bottom + 8

  // 如果头像在视口底部附近，就把 tooltip 放到头像上方。
  if (top > window.innerHeight - 56) {
    top = rect.top - 40
  }

  playerTooltipStyle.value = {
    left: `${left}px`,
    top: `${top}px`,
  }

  playerTooltipVisible.value = true
}

const hidePlayerTooltip = () => {
  hoveredPlayerName.value = ''
  playerTooltipVisible.value = false
}

const updatePlayerListWidth = async () => {
  await nextTick()

  if (!playerListScrollRef.value) {
    playerListWidth.value = 0
    return
  }

  playerListWidth.value = playerListScrollRef.value.clientWidth
}

onMounted(async () => {
  if (server.value.realtime) {
    const result = await GetServerStatus(server.value.serverUrl)

    if (result) {
      server.value.status = result
    }
  }

  await updatePlayerListWidth()

  if (playerListScrollRef.value) {
    playerListResizeObserver = new ResizeObserver(() => {
      updatePlayerListWidth()
    })

    playerListResizeObserver.observe(playerListScrollRef.value)
  }

  window.addEventListener('scroll', hidePlayerTooltip, true)
  window.addEventListener('resize', hidePlayerTooltip)
})

watch(playerListExpanded, async (expanded) => {
  hidePlayerTooltip()

  if (expanded) {
    await updatePlayerListWidth()
  }
})

watch(normalizedPlayers, async () => {
  await updatePlayerListWidth()
})

onUnmounted(() => {
  if (playerListResizeObserver) {
    playerListResizeObserver.disconnect()
  }

  window.removeEventListener('scroll', hidePlayerTooltip, true)
  window.removeEventListener('resize', hidePlayerTooltip)
})
</script>

<template>
  <div class="server-card">
    <div class="item-border">
      <button
        type="button"
        class="server-icon-button"
        :aria-label="`复制 ${server.name} 的服务器地址`"
        @click="copy(server.serverUrl || '')"
      >
        <img :src="server.status?.icon || server.icon" class="server-icon" alt="" />
      </button>

      <div class="item-info">
        <span
          style="
            color: white;
            line-height: 1.1rem;
            font-size: 1.1rem;
            margin-bottom: 5px;
            margin-top: 4px;
          "
          >{{ server.name }}</span
        >
        <span style="line-height: 1rem; margin-bottom: 3px">{{ server.description }}</span>
        <span style="line-height: 1rem; color: var(--minecraft-green-light)">{{
          server.status?.version
        }}</span>
      </div>

      <div class="item-status">
        <span class="server-status">
          <span class="status-text" v-if="server.realtime && server.status?.online">
            {{ server.status?.playerCount || 0 }}/{{ server.status?.capacity || 0 }}
          </span>
          <img class="status-img" :src="props.pingIcon" alt="pingIcon" />
        </span>

        <span class="server-actions">
          <a v-if="server.onlineMapUrl.trim() != ''" :href="server.onlineMapUrl">网页地图</a>

          <button
            v-if="canShowPlayerList"
            type="button"
            class="player-toggle-button"
            :aria-expanded="playerListExpanded"
            :aria-controls="playerListId"
            @click.stop="playerListExpanded = !playerListExpanded"
          >
            {{ playerListExpanded ? '收起玩家' : '查看玩家' }}
          </button>

          <button
            v-if="props.withDelete"
            type="button"
            class="delete-icon-button"
            :aria-label="`删除 ${server.name}`"
            @click.stop="emit('delete')"
          >
            <DeleteIcon class="delete-icon" aria-hidden="true" />
          </button>
        </span>
      </div>
    </div>

    <section
      v-if="canShowPlayerList"
      v-show="playerListExpanded"
      :id="playerListId"
      class="player-list-panel"
      :aria-label="`${server.name} 当前在线玩家列表`"
    >
      <div class="player-list-header">
        <span>在线玩家</span>
        <span>{{ normalizedPlayers.length }}/{{ server.status?.playerCount || 0 }}</span>
      </div>

      <div class="player-list-toolbar" aria-live="polite">
        <span v-if="hoveredPlayerName">当前玩家：{{ hoveredPlayerName }}</span>
        <span style="user-select: none" v-else>移动到头像上或按 Tab 选中头像查看玩家名</span>
      </div>

      <div
        ref="playerListScrollRef"
        class="player-list-scroll"
        tabindex="0"
        aria-label="横向滚动查看在线玩家头像"
      >
        <div class="player-list" :class="{ 'two-rows': shouldUseTwoPlayerRows }" role="list">
          <button
            v-for="player in normalizedPlayers"
            :key="player.uuid || player.name"
            type="button"
            class="player-avatar-card"
            role="listitem"
            :aria-label="`在线玩家 ${player.name}`"
            @mouseenter="showPlayerTooltip(player.name, $event)"
            @mouseleave="hidePlayerTooltip"
            @focus="showPlayerTooltip(player.name, $event)"
            @blur="hidePlayerTooltip"
          >
            <img
              class="player-avatar"
              :src="avatarUrl(player)"
              :alt="player.name"
              :data-avatar-index="0"
              loading="lazy"
              referrerpolicy="no-referrer"
              @error="onAvatarError($event, player)"
            />
          </button>
        </div>
      </div>

      <Teleport to="body">
        <div
          v-if="playerTooltipVisible"
          class="player-floating-tooltip"
          :style="playerTooltipStyle"
          role="tooltip"
        >
          {{ playerTooltipName }}
        </div>
      </Teleport>
    </section>
  </div>
</template>

<style lang="css" scoped>
.server-card {
  width: 100%;
  max-width: 768px;
  min-width: 20rem;
  margin: 0 auto;
  animation: fade-in-right 1s ease-in-out forwards;
}

.delete-icon-button {
  border: 0;
  padding: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.delete-icon-button:focus-visible,
.player-toggle-button:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 3px;
}

.server-icon-button {
  position: relative;
  width: 64px;
  height: 64px;
  border: 0;
  padding: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.server-icon-button:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 3px;
}

.item-border:focus-within::after {
  pointer-events: none;
  content: '';
  position: absolute;
  top: 2px;
  left: 4px;
  width: 64px;
  height: 64px;
  background: url('/UI/Arrow_Right.png') no-repeat center;
  background-size: 22px 34px;
  image-rendering: pixelated;
  z-index: 256;
}

.item-border:focus-within::before {
  pointer-events: none;
  content: '';
  position: absolute;
  top: 2px;
  left: 4px;
  width: 64px;
  height: 64px;
  background: rgba(128, 128, 128, 0.7);
  z-index: 128;
}

.item-border {
  position: relative;
  width: 100%;
  padding: 2px 4px;
  display: flex;
  flex-direction: row;
  min-width: 20rem;
  background-size: 100% auto;
  border: 2px solid transparent;
  box-sizing: border-box;
}

.server-card[type='focus'] > .item-border {
  background-color: black;
  border: 2px solid white;
}

.server-icon {
  position: relative;
  width: 64px;
  height: 64px;
  border: 1px solid grey;
  image-rendering: pixelated;
}

.item-border:hover::after {
  pointer-events: none;
  content: '';
  position: absolute;
  top: 2px;
  left: 4px;
  width: 64px;
  height: 64px;
  background: url('/UI/Arrow_Right.png') no-repeat center;
  background-size: 22px 34px;
  image-rendering: pixelated;
  z-index: 256;
}

.item-border:hover::before {
  pointer-events: none;
  content: '';
  position: absolute;
  top: 2px;
  left: 4px;
  width: 64px;
  height: 64px;
  background: rgba(128, 128, 128, 0.7);
  z-index: 128;
}

.item-info {
  display: flex;
  flex-direction: column;
  align-items: left;
  margin-left: 1rem;
  min-width: 0;
}

.item-info span {
  user-select: none;
}

.item-status {
  display: flex;
  flex-direction: column;
  text-align: right;
  margin-left: auto;
  margin-top: 0.5rem;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
}

.server-status {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.5rem;
}

.status-text {
  user-select: none;
  color: #aaaaaa;
}

.status-img {
  width: 20px;
  height: 14px;
  image-rendering: pixelated;
}

.server-actions {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.player-toggle-button {
  border: 0;
  padding: 0;
  color: var(--minecraft-green-light);
  background: transparent;
  font: inherit;
  cursor: pointer;
  text-decoration: underline;
  white-space: nowrap;
}

.player-toggle-button:hover {
  color: #fff;
}

.delete-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 1.2rem;
  width: 1.2rem;
  user-select: none;
  cursor: pointer;
  transition: all 0.1s ease-in-out;
}

.delete-icon:hover {
  color: #f56c6c;
}

.player-list-panel {
  width: calc(100% - 1rem);
  margin: 0 auto 0.35rem auto;
  padding: 0.5rem;
  box-sizing: border-box;
  color: #fff;
  background-color: rgba(0, 0, 0, 0.72);
  border-left: 2px solid #777;
  border-right: 2px solid #222;
  border-bottom: 2px solid #222;
  box-shadow:
    inset -2px -2px 0 0 rgba(0, 0, 0, 0.55),
    inset 2px 2px 0 0 rgba(255, 255, 255, 0.12);
}

.player-list-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
  color: var(--minecraft-green-light);
  font-size: 0.95rem;
  user-select: none;
}

.player-list-toolbar {
  min-height: 1.25rem;
  margin-bottom: 0.35rem;
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-list-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0.25rem;
  scrollbar-width: thin;
  scrollbar-color: #777 #222;
}

.player-list-scroll:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 3px;
}

.player-list-scroll::-webkit-scrollbar {
  height: 0.65rem;
}

.player-list-scroll::-webkit-scrollbar-track {
  background: #222;
  border: 1px solid #111;
}

.player-list-scroll::-webkit-scrollbar-thumb {
  background: #777;
  border: 1px solid #aaa;
}

.player-list {
  display: grid;
  grid-template-rows: 40px;
  grid-auto-flow: column;
  grid-auto-columns: 40px;
  gap: 8px;
  width: max-content;
  min-width: 100%;
  align-items: start;
}

.player-list.two-rows {
  grid-template-rows: repeat(2, 40px);
}

.player-avatar-card {
  position: relative;
  width: 40px;
  height: 40px;
  padding: 3px;
  border: 1px solid #555;
  background-color: rgba(255, 255, 255, 0.08);
  box-shadow:
    inset -1px -1px 0 0 #111,
    inset 1px 1px 0 0 #666;
  cursor: pointer;
}

.player-avatar-card:hover,
.player-avatar-card:focus-visible {
  background-color: rgba(100, 100, 255, 0.25);
  border-color: #fff;
  outline: none;
}

.player-avatar {
  display: block;
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
  border: 1px solid #777;
  background-color: #222;
}

.player-floating-tooltip {
  position: fixed;
  z-index: 99999;
  max-width: 16rem;
  padding: 0.3rem 0.5rem;
  color: #fff;
  background-color: rgba(0, 0, 0, 0.94);
  border: 1px solid #aaa;
  box-shadow:
    inset -1px -1px 0 0 #111,
    inset 1px 1px 0 0 #666,
    0 4px 10px rgba(0, 0, 0, 0.45);
  font-size: 0.85rem;
  line-height: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events: none;
  transform: translateX(-50%);
}

@media screen and (max-width: 768px) {
  .server-card {
    min-width: 0;
  }

  .item-border {
    min-width: 0;
  }

  .server-actions {
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
  }
}
</style>
