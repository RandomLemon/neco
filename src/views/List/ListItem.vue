<script lang="ts" setup>
import useClipboard from 'vue-clipboard3'
import { useToast } from 'vue-toastification'
import { GetServerStatus, type ServerEntity } from '../../api/serverlist'
import DeleteIcon from '@/components/icons/DeleteIcon.vue'
import { onMounted } from 'vue'

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
  }
})

const server = defineModel('server', {
  type: Object as () => ServerEntity,
  required: true,
})

const emit = defineEmits(['delete'])

onMounted(async () => {
  if (!server.value.realtime) {
    return
  }
  const result = await GetServerStatus(server.value.serverUrl)
  if (result) {
    server.value.status = result
  }
})
</script>

<template>
  <div class="item-border">
    <img
      :src="server.icon"
      class="server-icon"
      alt="icon"
      @click="copy(server.serverUrl || '')"
    />
    <div class="item-info">
      <span style="color: white; line-height: 1.1rem; font-size: 1.1rem; margin-bottom: 5px; margin-top: 4px;">{{ server.name }}</span>
      <span style="line-height: 1rem; margin-bottom: 3px;">{{ server.description }}</span>
      <span style="line-height: 1rem; color: var(--minecraft-green-light);">{{ server.status?.version }}</span>
    </div>
    <div class="item-status">
      <span class="server-status">
        <text class="status-text" v-if="server.realtime && server.status?.online"
          >{{ server.status?.playerCount || 0 }}/{{ server.status?.capacity || 0 }}</text
        >
        <img class="status-img" :src="props.pingIcon" alt="pingIcon" />
      </span>
      <span style="margin-top: auto; display: flex; align-items: center; justify-content: center;">
        <a v-if="server.onlineMapUrl.trim() != ''" :href="server.onlineMapUrl"
          >网页地图</a
        >
        <DeleteIcon
          class="delete-icon"
          v-if="props.withDelete"
          @click="emit('delete')"
        />
      </span>
    </div>
  </div>
</template>

<style lang="css" scoped>
.item-border {
  position: relative;
  width: 100%;
  max-width: 768px;
  padding: 2px 4px;
  display: flex;
  flex-direction: row;
  margin: 0 auto;
  min-width: 20rem;
  background-size: 100% auto;
  animation: fade-in-right 1s ease-in-out forwards;
  border: 2px solid transparent;
}

.item-border[type='focus'] {
  background-color: black;
  border: 2px solid white;
}

.server-icon {
  position: relative;
  width: 64px;
  height: 64px;
  border: 1px solid grey;
}

.item-border:hover::after {
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

.delete-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 0.5rem;
  height: 1.2rem;
  width: 1.2rem;

  user-select: none;
  cursor: pointer;
  transition: all 0.1s ease-in-out;
}

.delete-icon:hover {
  color: #f56c6c;
}
</style>
