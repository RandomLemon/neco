<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import {
  CreateServer,
  DeleteServer,
  GetServerList,
  UpdateServer,
  type ServerEntity,
} from '@/api/serverlist'
import ListItem from '@/views/List/ListItem.vue'
import MinecraftButtonClassic from '@/components/utils/MinecraftButtonClassic.vue'
import MinecraftDialog from '@/components/utils/MinecraftDialog.vue'
import { useToast } from 'vue-toastification'
import MinecraftInput from '@/components/utils/MinecraftInput.vue'
import PlusIcon from '@/components/icons/PlusIcon.vue'
import MinecraftSwitch from '@/components/utils/MinecraftSwitch.vue'

const toBase64 = async (image: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (image.size > 1024 * 1024) {
      return reject(new Error('File size exceeds 1MB'))
    }
    const reader = new FileReader()

    reader.onload = () => {
      const base64str = reader.result as string
      resolve(base64str)
    }

    reader.onerror = reject

    reader.readAsDataURL(image)
  })
}

const triggerUploadBase64 = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.click()

    input.onchange = async () => {
      const image = input.files?.[0]
      if (!image) return reject(new Error('No image selected'))

      try {
        const base64str = await toBase64(image)
        resolve(base64str)
      } catch (error) {
        reject(error)
      }
    }
  })
}

const toast = useToast()

const userGroup = ref(JSON.parse(localStorage.getItem('userGroup') || '[]'))

const serverList = ref<ServerEntity[]>([])
const serverPing = ref<string[]>([])
const focusIndex = ref(-1)

const onClick = (index: number) => {
  focusIndex.value = index
}

const editStatus = ref('none')
const iconOptionsVisible = ref(false)

const onSelectIcon = async () => {
  try {
    const base64str = await triggerUploadBase64()
    server.icon = base64str
  } catch (e) {
    toast.error(`上传文件失败：${e}！`)
    return
  }
  iconOptionsVisible.value = false
}

const onEditIcon = () => {
  iconOptionsVisible.value = true
  editIcon.value = server.icon
}

const server = reactive({
  id: '',
  name: '',
  icon: '',
  description: '',
  onlineMapUrl: '',
  realtime: false,
  serverUrl: '',
})
const editIcon = ref('')

const commitServer = async () => {
  if (server.name.trim() === '') {
    toast.error('服务器名称不能为空！')
    return
  }
  if (server.description.trim() === '') {
    toast.error('服务器简介不能为空！')
    return
  }
  if (server.realtime && server.serverUrl.trim() === '') {
    toast.error('服务器地址不能为空！')
    return
  }
  let result: string | null = null
  result = await UpdateServer(server)
  if (!result) {
    toast.success('服务器信息保存成功！')
    if (server.id === localStorage.getItem('serverId')) {
      localStorage.removeItem('serverId')
    }
    editStatus.value = 'none'
    focusIndex.value = -1
    Object.assign(server, {
      id: '',
      name: '',
      icon: '',
      description: '',
      onlineMapUrl: '',
      realtime: false,
      serverUrl: '',
    })
    await refresh()
  } else {
    toast.error(`服务器信息保存失败：${result}！`)
    await refresh()
  }
}

const onNewServer = async () => {
  let serverId: string = localStorage.getItem('serverId') || ''
  if (serverId.trim() === '') {
    serverId = (await CreateServer()) || ''
    if (serverId.trim() === '') {
      toast.error('创建服务器失败！')
      editStatus.value = 'none'
      return
    } else {
      localStorage.setItem('serverId', serverId)
    }
  }
  editStatus.value = 'new'
  Object.assign(server, {
    id: serverId,
    name: '',
    icon: '',
    description: '',
    onlineMapUrl: '',
    realtime: false,
    serverUrl: '',
  })
  editIcon.value = ''
}

const onEditServer = () => {
  if (focusIndex.value === -1) {
    toast.warning('未选择服务器！')
    return
  }
  editStatus.value = 'edit'
  Object.assign(server, serverList.value[focusIndex.value])
}

const onDeleteServer = async (index: number) => {
  const result = await DeleteServer(serverList.value[index].id)
  if (!result) {
    toast.success('服务器删除成功！')
    await refresh()
  } else {
    toast.error(`服务器删除失败：${result}！`)
  }
}

let direction = 1
let pingFrame = 1
let pingTimer: NodeJS.Timeout | undefined = undefined

const refresh = async () => {
  serverList.value = []
  serverList.value = await GetServerList()
  serverPing.value = []
  if (pingTimer) {
    clearInterval(pingTimer)
    pingTimer = undefined
    direction = 1
    pingFrame = 1
  }
  let hasNotOnline = false
  for (let i = 0; i < serverList.value.length; i++) {
    if (!serverList.value[i].realtime) {
      serverPing.value.push(`/UI/server/Server_Unreachable.png`)
    } else {
      hasNotOnline = true
      serverPing.value.push(`/UI/server/Server_Pinging_${pingFrame}.png`)
    }
  }
  if (hasNotOnline) {
    pingTimer = setInterval(() => {
      for (let i = 0; i < serverList.value.length; i++) {
        if (serverPing.value[i].startsWith('/UI/server/Server_Pinging_')) {
          if (serverList.value[i].status !== undefined) {
            if (serverList.value[i].status?.online) {
              const latency = serverList.value[i].status?.latency || 0
              if (latency <= 150) {
                serverPing.value[i] = `/UI/server/Server_Ping_5.png`
              } else if (latency <= 300) {
                serverPing.value[i] = `/UI/server/Server_Ping_4.png`
              } else if (latency <= 450) {
                serverPing.value[i] = `/UI/server/Server_Ping_3.png`
              } else if (latency <= 600) {
                serverPing.value[i] = `/UI/server/Server_Ping_2.png`
              } else {
                serverPing.value[i] = `/UI/server/Server_Ping_1.png`
              }
            } else {
              serverPing.value[i] = `/UI/server/Server_Unreachable.png`
            }
          } else {
            serverPing.value[i] = `/UI/server/Server_Pinging_${pingFrame}.png`
          }
        }
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
  <div class="management-tab-title-container">
    <h1 class="management-tab-title">服务器信息</h1>
    <span class="management-tab-subtitle">！？强强？！</span>
  </div>
  <form
    class="management-tab-form"
    v-if="userGroup.includes('admin') || userGroup.includes('server_admin')"
    aria-labelledby="server-list-title"
  >
    <div class="management-tab-form-item">
      <h2 id="server-list-title" class="management-tab-form-title">服务器列表</h2>
    </div>
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
        @dblclick="focusIndex === index ? onEditServer() : null"
        :type="focusIndex === index ? 'focus' : ''"
        :with-delete="true"
        @delete="onDeleteServer(index)"
      />
    </div>
    <div class="server-list-actions">
      <MinecraftButtonClassic
        class="server-list-action"
        @click="focusIndex !== -1 ? onEditServer() : toast.warning('请先选择服务器！')"
      >
        编辑选中服务器
      </MinecraftButtonClassic>
    </div>
  </form>
  <MinecraftButtonClassic
    style="font-size: 1.5rem"
    @click="onNewServer"
    v-if="userGroup.includes('admin') || userGroup.includes('news_admin')"
    >添加服务器信息</MinecraftButtonClassic
  >
  <form class="management-tab-form" v-if="editStatus !== 'none'" @submit.prevent="commitServer">
    <h2 class="management-tab-form-title">编辑服务器信息</h2>
    <div class="server-input-item">
      <label class="server-input-label" for="server-id-input"> 服务器 ID </label>

      <MinecraftInput
        id="server-id-input"
        class="server-input"
        v-model="server.id"
        placeholder="请输入服务器 ID"
        disabled
      />
    </div>
    <div class="server-input-item">
      <label class="server-input-label" for="server-name-input"> 名称 </label>

      <MinecraftInput
        id="server-name-input"
        class="server-input"
        v-model="server.name"
        placeholder="请输入服务器名称"
      />
    </div>
    <div class="server-input-item">
      <label class="server-input-label" for="server-description-input"> 简介 </label>

      <MinecraftInput
        id="server-description-input"
        class="server-input"
        v-model="server.description"
        placeholder="请输入服务器简介"
      />
    </div>
    <div class="server-input-item">
      <span class="server-input-label">服务器图标</span>
      <button
        v-if="server.icon.trim() === ''"
        type="button"
        class="upload-button"
        aria-label="上传服务器图标"
        @click="onEditIcon"
      >
        <PlusIcon aria-hidden="true" />
      </button>

      <button
        v-else
        type="button"
        class="server-image-picture"
        aria-label="更换服务器图标"
        @click="onEditIcon"
      >
        <img class="server-image" :src="server.icon" alt="" />
      </button>
    </div>
    <div class="server-input-item">
      <label class="server-input-label" for="server-map-url-input"> 网页地图链接 </label>

      <MinecraftInput
        id="server-map-url-input"
        class="server-input"
        v-model="server.onlineMapUrl"
        placeholder="没有可留空"
      />
    </div>
    <div class="server-input-item">
      <label class="server-input-label" for="server-realtime-switch">
        是否需要同步服务器信息
      </label>

      <MinecraftSwitch id="server-realtime-switch" v-model="server.realtime" />
    </div>
    <div class="server-input-item">
      <label class="server-input-label" for="server-url-input"> 服务器地址 </label>

      <MinecraftInput
        id="server-url-input"
        class="server-input"
        v-model="server.serverUrl"
        placeholder="没有可留空"
      />
    </div>
    <MinecraftButtonClassic native-type="submit"> 保存 </MinecraftButtonClassic>
  </form>
  <MinecraftDialog title="编辑服务器 Logo" v-model="iconOptionsVisible">
    <div class="icon-options-container">
      <label class="icon-options-label" for="server-icon-url"> 图片地址 </label>

      <div class="icon-options-input-container">
        <MinecraftInput
          id="server-icon-url"
          class="icon-options-input"
          v-model="editIcon"
          placeholder="填入图片链接"
        />

        <MinecraftButtonClassic
          class="icon-options-button"
          @click="((server.icon = editIcon), (iconOptionsVisible = false))"
        >
          保存
        </MinecraftButtonClassic>
      </div>
    </div>
    <div class="icon-options-container">
      <span class="icon-options-label">直接上传</span>
      <MinecraftButtonClassic
        class="icon-options-button"
        style="width: 10rem"
        @click="onSelectIcon"
      >
        ↑ 点击上传
      </MinecraftButtonClassic>
    </div>
    <template v-slot:footer>
      <span></span>
    </template>
  </MinecraftDialog>
</template>

<style lang="css" scoped>
.server-list-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.server-list-action {
  width: 10rem;
}

.upload-button,
.server-image-picture {
  border: 0;
  padding: 0;
  background: transparent;
  color: inherit;
  font: inherit;
}

.upload-button:focus-visible,
.server-image-picture:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 4px;
}

.server-input-item {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.server-input-label {
  user-select: none;
  font-size: 1.2rem;
  color: #fff;
  text-wrap: nowrap;
}

.server-input {
  font-size: 1rem;
  width: 100%;
  min-width: 5rem;
}

.icon-options-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.icon-options-label {
  font-size: 1.2rem;
  user-select: none;
}

.icon-options-input-container {
  display: flex;
  gap: 1rem;
}

.icon-options-input {
  font-size: 1rem;
  padding: 0.5rem;
  width: 100%;
  margin: auto;
}

.icon-options-button {
  width: 6rem;
  font-size: 1.2rem;
}

.upload-button {
  width: 4rem;
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #fff;
  color: white;
  cursor: pointer;
  padding: 1.2rem;
  background-color: rgba(255, 255, 255, 0);
  transition: all 0.2s ease-in-out;
}

.upload-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.server-image {
  height: 6rem;
  width: auto;
  user-select: none;
}

.server-image-picture {
  cursor: pointer;
  height: 6rem;
  width: min-content;
  position: relative;
}

.server-image-picture::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  background-color: rgba(255, 255, 255, 0);
  transition: all 0.2s ease-in-out;
}

.server-image-picture:hover::after {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>
