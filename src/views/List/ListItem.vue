<script lang="ts" setup>
import useClipboard from 'vue-clipboard3'
import { useToast } from 'vue-toastification'
import { type ServerEntity } from '../../api/serverlist'

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
  server: {
    type: Object as () => ServerEntity,
    required: true,
  },
  pingIcon: {
    type: String,
    required: true,
  },
  withDelete: {
    type: Boolean,
    default: false,
  }
})

const emit = defineEmits(['delete'])
</script>

<template>
  <div class="item-border">
    <img
      :src="props.server.icon"
      class="server-icon"
      alt="icon"
      style="border: 1px solid grey"
      @click="copy(props.server.serverUrl || '')"
    />
    <div class="item-info">
      <span style="color: white; font-size: 1.1rem">{{ props.server.name }}</span>
      <span>{{ props.server.description }}</span>
    </div>
    <div class="item-status">
      <span class="server-status">
        <text class="status-text" v-if="props.server.realtime && props.server.online"
          >{{ props.server.playerCount || 0 }}/{{ props.server.capacity || 0 }}</text
        >
        <img class="status-img" :src="props.pingIcon" alt="pingIcon" />
      </span>
      <span style="margin-top: auto; display: flex; align-items: center; justify-content: center;">
        <a v-if="props.server.onlineMapUrl.trim() != ''" :href="props.server.onlineMapUrl"
          >网页地图</a
        >
        <text
          class="delete-icon"
          v-if="props.withDelete"
          @click="emit('delete')"
        >X</text>
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
  justify-content: center;
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

  font-size: 1.5rem;
  user-select: none;
  cursor: pointer;
  transition: all 0.1s ease-in-out;
}

.delete-icon:hover {
  color: #f56c6c;
}
</style>
