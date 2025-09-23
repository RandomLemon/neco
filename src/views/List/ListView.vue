<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { GetServerList, type ServerEntity } from '../../api/serverlist'
import useClipboard from 'vue-clipboard3'
import ListItem from './ListItem.vue'
import MinecraftButtonClassic from '@/components/utils/MinecraftButtonClassic.vue'
import { useToast } from 'vue-toastification'

const randomInt = (l: number, r: number): number => {
  return Math.round(Math.random() * (r - l)) + l
}

const toast = useToast()
const { toClipboard } = useClipboard()

const serverList = ref<ServerEntity[]>([])
const serverPing = ref<string[]>([])
const focusIndex = ref(-1)

const onClick = (index: number) => {
  focusIndex.value = index
}

const copy = async (text: string) => {
  try {
    await toClipboard(text)
    toast.success('服务器链接已复制！')
  } catch {
    toast.error('链接复制失败！')
  }
}

let direction = 1
let pingFrame = 1
let pingTimer: NodeJS.Timeout | undefined = undefined
let notOnlineServerIndexs: number[] = []

const refresh = async () => {
  serverList.value = await GetServerList()
  serverPing.value = []
  notOnlineServerIndexs = []
  if (pingTimer) {
    clearInterval(pingTimer)
    pingTimer = undefined
    direction = 1
    pingFrame = 1
  }
  let hasNotOnline = false
  for (let i = 0; i < serverList.value.length; i++) {
    if (serverList.value[i].realtime) {
      if (!serverList.value[i].online) {
        serverPing.value.push(`/UI/server/Server_Unreachable.png`)
      } else {
        serverPing.value.push(`/UI/server/Server_Ping_${randomInt(1, 5)}.png`)
      }
    } else {
      hasNotOnline = true
      notOnlineServerIndexs.push(i)
      serverPing.value.push(`/UI/server/Server_Pinging_${pingFrame}.png`)
    }
  }
  if (hasNotOnline) {
    pingTimer = setInterval(() => {
      for (let i = 0; i < notOnlineServerIndexs.length; i++) {
        const index = notOnlineServerIndexs[i]
        serverPing.value[index] = `/UI/server/Server_Pinging_${pingFrame}.png`
      }
      if (pingFrame > 4) {
        direction = -1
      } else if (pingFrame <= 1) {
        direction = 1
      }
      pingFrame += direction
    }, 150)
  }
}

onMounted(async () => {
  await refresh()
})
</script>

<template>
  <div class="list-area">
    <div class="list-item-container">
      <ListItem
        class="list-item"
        v-for="(server, index) in serverList"
        :style="{
          '--delay': serverList.indexOf(server) * 0.2 + 's',
        }"
        :ping-icon="serverPing[index]"
        :key="server.name"
        :server="server"
        @click="onClick(index)"
        @dblclick="focusIndex === index ? copy(server.serverUrl || 'undefined') : null"
        :type="focusIndex === index ? 'focus' : ''"
      />
    </div>
    <div class="server-options">
      <MinecraftButtonClassic class="server-option" @click="refresh">刷新</MinecraftButtonClassic>
      <MinecraftButtonClassic
        class="server-option"
        @click="
          focusIndex !== -1
            ? copy(serverList[focusIndex].serverUrl || 'undefined')
            : toast.warning('未选择服务器！')
        "
        >加入服务器</MinecraftButtonClassic
      >
    </div>
  </div>
</template>

<style lang="css" scoped>
.list-area {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 5rem;
  box-sizing: border-box;
  background-image: url('/background/list-background.png');
  background-position: center;
  background-size: cover;

  position: relative;
}

.list-item-container {
  flex: 3;
  width: 100%;
  border-top: 1px solid #eeeeee;
  border-bottom: 1px solid #eeeeee;
  padding: 8px 0;
  background-color: rgba(0, 0, 0, 0.6);
  overflow-y: auto;
}

.list-area::before {
  position: absolute;
  content: '';
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  backdrop-filter: blur(2px);
  background-color: rgba(0, 0, 0, 0.2);
}

.list-item {
  opacity: 0;
  animation: fade-in-right 0.5s ease-in-out forwards;
  animation-delay: var(--delay);
}

.server-options {
  flex: 2;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  z-index: 1;
}

.server-option {
  width: 12rem;
}
</style>
