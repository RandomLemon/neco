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
    toast.error('链接复制失败！')
  }
}

const props = defineProps({
  server: {
    type: Object as () => ServerEntity,
    required: true,
  },
})
</script>

<template>
  <div class="item-border" @dblclick="copy(props.server.serverUrl)">
    <img
      :src="props.server.icon"
      alt="icon"
      width="64"
      height="64"
      style="border: 1px solid grey"
      @click="copy(props.server.serverUrl)"
    />
    <div class="item-info">
      <span style="color: white; font-size: 1.1rem;">{{ props.server.name }}</span>
      <span>{{ props.server.description }}</span>
    </div>
    <div class="item-status">
      <span v-if="props.server.playerCount != -1">{{ props.server.playerCount }}</span>
      <span v-if="props.server.playerCount != -1">/</span>
      <span v-if="props.server.capacity != -1">{{ props.server.capacity }}</span>
      <span style="margin-top: auto">
        <a v-if="props.server.onlineMapUrl != ''" :href="props.server.onlineMapUrl">网页地图</a>
        <span v-if="props.server.onlineMapUrl != '' && props.server.serverUrl != ''">/</span>
        <a v-if="props.server.serverUrl != ''" :href="props.server.serverUrl">服务器地址</a>
      </span>
    </div>
  </div>
</template>

<style lang="css" scoped>
.item-border {
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

.item-border[type="focus"] {
  background-color: black;
  border: 2px solid white;
}

.item-border img {
  position: relative;
}

.item-border:hover img::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('/UI/Arrow_Right.png') no-repeat center;
  background-size: 22px 34px;
  image-rendering: pixelated;
}

.item-border:hover img::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(128, 128, 128, 0.7);
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
</style>
