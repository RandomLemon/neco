<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { AddServer, GetServerList, UpdateServer, type ServerEntity } from '@/api/serverlist'
import ListItem from '@/views/List/ListItem.vue'
import MinecraftButtonClassic from '@/components/utils/MinecraftButtonClassic.vue'
import MinecraftDialog from '@/components/utils/MinecraftDialog.vue'
import { useToast } from 'vue-toastification'
import MinecraftInput from '@/components/utils/MinecraftInput.vue'
import PlusIcon from '@/components/icons/PlusIcon.vue'
import MinecraftSwitch from '@/components/utils/MinecraftSwitch.vue'

const randomInt = (l: number, r: number): number => {
  return Math.round(Math.random() * (r - l)) + l
}

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
  if (editStatus.value === 'new') {
    result = await AddServer(server)
  } else if (editStatus.value === 'edit') {
    result = await UpdateServer(serverList.value[focusIndex.value])
  }
  if (!result) {
    toast.success('服务器信息保存成功！')
    editStatus.value = 'none'
    focusIndex.value = -1
    Object.assign(server, {
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

const onNewServer = () => {
  editStatus.value = 'new'
  Object.assign(server, {
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
  <div class="management-tab-title-container">
    <text class="management-tab-title">服务器信息</text>
    <text class="management-tab-subtitle">！？强强？！</text>
  </div>
  <form
    class="management-tab-form"
    v-if="userGroup.includes('admin') || userGroup.includes('server_admin')"
  >
    <div class="management-tab-form-item">
      <text class="management-tab-form-title">服务器列表</text>
      <text class="management-tab-form-subtitle">双击以编辑！</text>
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
      />
    </div>
  </form>
  <MinecraftButtonClassic
    style="font-size: 1.5rem"
    @click="onNewServer"
    v-if="userGroup.includes('admin') || userGroup.includes('news_admin')"
    >添加服务器信息</MinecraftButtonClassic
  >
  <form class="management-tab-form" v-if="editStatus !== 'none'">
    <text class="management-tab-form-title">编辑服务器信息</text>
    <div class="server-input-item">
      <text class="server-input-label">名称</text>
      <MinecraftInput
        class="server-input"
        v-model="server.name"
        placeholder="请输入服务器名称"
        :disabled="editStatus === 'edit'"
      />
    </div>
    <div class="server-input-item">
      <text class="server-input-label">简介</text>
      <MinecraftInput
        class="server-input"
        v-model="server.description"
        placeholder="请输入服务器简介"
      />
    </div>
    <div class="server-input-item">
      <text class="server-input-label">服务器图标</text>
      <div class="upload-button" v-if="server.icon.trim() === ''" @click="onEditIcon">
        <PlusIcon />
      </div>
      <picture class="server-image-picture" @click="onEditIcon" v-else>
        <img class="server-image" :src="server.icon" alt="news-image" />
      </picture>
    </div>
    <div class="server-input-item">
      <text class="server-input-label">网页地图链接</text>
      <MinecraftInput class="server-input" v-model="server.onlineMapUrl" placeholder="没有可留空" />
    </div>
    <div class="server-input-item">
      <text class="server-input-label">是否需要同步服务器信息</text>
      <MinecraftSwitch v-model="server.realtime" />
    </div>
    <div class="server-input-item" v-if="server.realtime">
      <text class="server-input-label">服务器地址</text>
      <MinecraftInput
        class="server-input"
        v-model="server.serverUrl"
        placeholder="请输入服务器地址"
      />
    </div>
    <MinecraftButtonClassic @click="commitServer">保存</MinecraftButtonClassic>
  </form>
  <MinecraftDialog title="编辑服务器 Logo" v-model="iconOptionsVisible">
    <div class="icon-options-container">
      <text class="icon-options-label">图片地址</text>
      <div class="icon-options-input-container">
        <MinecraftInput class="icon-options-input" v-model="editIcon" placeholder="填入图片链接" />
        <MinecraftButtonClassic
          class="icon-options-button"
          @click="((server.icon = editIcon), (iconOptionsVisible = false))"
          >保存</MinecraftButtonClassic
        >
      </div>
    </div>
    <div class="icon-options-container">
      <text class="icon-options-label">直接上传</text>
      <MinecraftButtonClassic class="icon-options-button" style="width: 10rem" @click="onSelectIcon"
        ><span style="font-size: 2rem">↑</span> 点击上传</MinecraftButtonClassic
      >
    </div>
    <template v-slot:footer>
      <span></span>
    </template>
  </MinecraftDialog>
</template>

<style lang="css" scoped>
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
