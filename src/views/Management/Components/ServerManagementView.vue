<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
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
import MinecraftInput from '@/components/utils/MinecraftInput.vue'
import MinecraftSwitch from '@/components/utils/MinecraftSwitch.vue'
import PlusIcon from '@/components/icons/PlusIcon.vue'
import { useToast } from 'vue-toastification'

const toast = useToast()
const userGroup = ref<string[]>(JSON.parse(localStorage.getItem('userGroup') || '[]'))

const canManageServer = computed(() => {
  return userGroup.value.includes('admin') || userGroup.value.includes('server_admin')
})

const serverList = ref<ServerEntity[]>([])
const serverPing = ref<string[]>([])
const focusIndex = ref(-1)

const editStatus = ref<'none' | 'new' | 'edit'>('none')
const iconOptionsVisible = ref(false)
const deleteServerDialogVisible = ref(false)
const pendingDeleteServerIndex = ref(-1)

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

const selectedServer = computed(() => {
  if (focusIndex.value < 0) return null
  return serverList.value[focusIndex.value] || null
})

const pendingDeleteServer = computed(() => {
  if (pendingDeleteServerIndex.value < 0) return null
  return serverList.value[pendingDeleteServerIndex.value] || null
})

const resetServerDraft = () => {
  Object.assign(server, {
    id: '',
    name: '',
    icon: '',
    description: '',
    onlineMapUrl: '',
    realtime: false,
    serverUrl: '',
  })
  editIcon.value = ''
}

const toBase64 = async (image: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (image.size > 1024 * 1024) {
      return reject(new Error('File size exceeds 1MB'))
    }

    const reader = new FileReader()

    reader.onload = () => {
      resolve(reader.result as string)
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
        resolve(await toBase64(image))
      } catch (error) {
        reject(error)
      }
    }
  })
}

const onClick = (index: number) => {
  focusIndex.value = index
}

const onSelectIcon = async () => {
  try {
    server.icon = await triggerUploadBase64()
    iconOptionsVisible.value = false
  } catch (e) {
    toast.error(`上传文件失败：${e}！`)
  }
}

const onEditIcon = () => {
  iconOptionsVisible.value = true
  editIcon.value = server.icon
}

const validateServer = () => {
  if (server.name.trim() === '') {
    toast.error('服务器名称不能为空！')
    return false
  }

  if (server.description.trim() === '') {
    toast.error('服务器简介不能为空！')
    return false
  }

  if (server.realtime && server.serverUrl.trim() === '') {
    toast.error('开启同步时，服务器地址不能为空！')
    return false
  }

  return true
}

const commitServer = async () => {
  if (!validateServer()) return

  const result = await UpdateServer(server)

  if (!result) {
    toast.success('服务器信息保存成功！')

    if (server.id === localStorage.getItem('serverId')) {
      localStorage.removeItem('serverId')
    }

    editStatus.value = 'none'
    focusIndex.value = -1
    resetServerDraft()
    await refresh()
  } else {
    toast.error(`服务器信息保存失败：${result}！`)
    await refresh()
  }
}

const cancelEditServer = () => {
  editStatus.value = 'none'
  resetServerDraft()
}

const onNewServer = async () => {
  let serverId = localStorage.getItem('serverId') || ''

  if (serverId.trim() === '') {
    serverId = (await CreateServer()) || ''

    if (serverId.trim() === '') {
      toast.error('创建服务器失败！')
      editStatus.value = 'none'
      return
    }

    localStorage.setItem('serverId', serverId)
  }

  editStatus.value = 'new'
  focusIndex.value = -1

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
  if (focusIndex.value === -1 || !selectedServer.value) {
    toast.warning('请先选择一个服务器！')
    return
  }

  editStatus.value = 'edit'
  Object.assign(server, selectedServer.value)
  editIcon.value = server.icon
}

const openDeleteServerDialog = (index: number) => {
  pendingDeleteServerIndex.value = index
  deleteServerDialogVisible.value = true
}

const onConfirmDeleteServer = async () => {
  if (pendingDeleteServerIndex.value < 0) return

  const target = serverList.value[pendingDeleteServerIndex.value]
  if (!target) return

  const result = await DeleteServer(target.id)

  if (!result) {
    toast.success('服务器删除成功！')
    focusIndex.value = -1
    pendingDeleteServerIndex.value = -1
    await refresh()
  } else {
    toast.error(`服务器删除失败：${result}！`)
  }
}

let direction = 1
let pingFrame = 1
let pingTimer: ReturnType<typeof setInterval> | undefined = undefined

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

  let hasRealtimeServer = false

  for (let i = 0; i < serverList.value.length; i++) {
    if (!serverList.value[i].realtime) {
      serverPing.value.push('/UI/server/Server_Unreachable.png')
    } else {
      hasRealtimeServer = true
      serverPing.value.push(`/UI/server/Server_Pinging_${pingFrame}.png`)
    }
  }

  if (hasRealtimeServer) {
    pingTimer = setInterval(() => {
      for (let i = 0; i < serverList.value.length; i++) {
        if (!serverPing.value[i]?.startsWith('/UI/server/Server_Pinging_')) continue

        if (serverList.value[i].status !== undefined) {
          if (serverList.value[i].status?.online) {
            const latency = serverList.value[i].status?.latency || 0

            if (latency <= 150) {
              serverPing.value[i] = '/UI/server/Server_Ping_5.png'
            } else if (latency <= 300) {
              serverPing.value[i] = '/UI/server/Server_Ping_4.png'
            } else if (latency <= 450) {
              serverPing.value[i] = '/UI/server/Server_Ping_3.png'
            } else if (latency <= 600) {
              serverPing.value[i] = '/UI/server/Server_Ping_2.png'
            } else {
              serverPing.value[i] = '/UI/server/Server_Ping_1.png'
            }
          } else {
            serverPing.value[i] = '/UI/server/Server_Unreachable.png'
          }
        } else {
          serverPing.value[i] = `/UI/server/Server_Pinging_${pingFrame}.png`
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

onMounted(refresh)
</script>

<template>
  <div class="management-tab-title-container">
    <h1 class="management-tab-title">服务器信息</h1>
    <span class="management-tab-subtitle">你根本就不强</span>
  </div>

  <section
    v-if="!canManageServer"
    class="management-section"
    aria-labelledby="server-no-permission-title"
  >
    <div class="management-empty-state">
      <strong id="server-no-permission-title">权限不足</strong>
      <span>只有超级管理员或服务器管理员可以修改服务器信息。</span>
    </div>
  </section>

  <template v-else>
    <section class="management-section" aria-labelledby="server-list-title">
      <div class="management-section-header">
        <div class="management-section-title-block">
          <h2 id="server-list-title" class="management-section-title">服务器列表</h2>
          <p class="management-section-desc">
            当前共有 {{ serverList.length }} 个服务器。点击选中，双击可快速编辑。
          </p>
        </div>

        <div class="management-toolbar">
          <MinecraftButtonClassic class="server-toolbar-button" @click="refresh">
            刷新列表
          </MinecraftButtonClassic>

          <MinecraftButtonClassic class="server-toolbar-button" @click="onNewServer">
            添加服务器
          </MinecraftButtonClassic>
        </div>
      </div>

      <div v-if="serverList.length > 0" class="list-item-container">
        <ListItem
          class="list-item"
          v-for="(item, index) in serverList"
          :style="{ '--delay': index * 0.2 + 's' }"
          :ping-icon="serverPing[index]"
          :key="item.id || item.name"
          :server="item"
          :type="focusIndex === index ? 'focus' : ''"
          :with-delete="true"
          @click="onClick(index)"
          @dblclick="focusIndex === index ? onEditServer() : null"
          @delete="openDeleteServerDialog(index)"
        />
      </div>

      <div v-else class="management-empty-state">
        <strong>暂无服务器</strong>
        <span>点击“添加服务器”创建一个新的服务器条目。</span>
      </div>

      <div class="management-action-row">
        <span class="server-selected-text"> 当前选中：{{ selectedServer?.name || '无' }} </span>

        <MinecraftButtonClassic
          class="server-action-button"
          @click="focusIndex !== -1 ? onEditServer() : toast.warning('请先选择服务器！')"
        >
          编辑选中服务器
        </MinecraftButtonClassic>
      </div>
    </section>

    <form
      v-if="editStatus !== 'none'"
      class="management-section"
      aria-labelledby="server-edit-title"
      @submit.prevent="commitServer"
    >
      <div class="management-section-header">
        <div class="management-section-title-block">
          <h2 id="server-edit-title" class="management-section-title">
            {{ editStatus === 'new' ? '新增服务器' : '编辑服务器' }}
          </h2>
          <p class="management-section-desc">
            配置服务器基础信息、展示图标、网页地图与实时同步地址。
          </p>
        </div>
      </div>

      <section class="management-card" aria-labelledby="server-basic-title">
        <h3 id="server-basic-title" class="management-card-title">基础信息</h3>

        <div class="management-grid-form">
          <div class="management-field">
            <label class="management-field-label" for="server-id-input">服务器 ID</label>
            <MinecraftInput id="server-id-input" v-model="server.id" disabled />
          </div>

          <div class="management-field">
            <label class="management-field-label" for="server-name-input">名称</label>
            <MinecraftInput
              id="server-name-input"
              v-model="server.name"
              placeholder="请输入服务器名称"
            />
          </div>

          <div class="management-field full">
            <label class="management-field-label" for="server-description-input">简介</label>
            <MinecraftInput
              id="server-description-input"
              v-model="server.description"
              placeholder="请输入服务器简介"
            />
          </div>
        </div>
      </section>

      <section class="management-card" aria-labelledby="server-display-title">
        <h3 id="server-display-title" class="management-card-title">展示信息</h3>

        <div class="management-grid-form">
          <div class="management-field">
            <span class="management-field-label">服务器图标</span>

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

          <div class="management-field">
            <label class="management-field-label" for="server-map-url-input">网页地图链接</label>
            <MinecraftInput
              id="server-map-url-input"
              v-model="server.onlineMapUrl"
              placeholder="没有可留空"
            />
            <p class="management-field-help">填写后会在服务器列表显示“网页地图”。</p>
          </div>
        </div>
      </section>

      <section class="management-card" aria-labelledby="server-sync-title">
        <h3 id="server-sync-title" class="management-card-title">实时同步</h3>

        <div class="management-grid-form">
          <div class="management-field">
            <label class="management-field-label" for="server-realtime-switch">
              是否同步服务器信息
            </label>
            <MinecraftSwitch id="server-realtime-switch" v-model="server.realtime" />
            <p class="management-field-help">开启后会同步在线人数、版本、延迟和玩家列表。</p>
          </div>

          <div class="management-field">
            <label class="management-field-label" for="server-url-input">服务器地址</label>
            <MinecraftInput
              id="server-url-input"
              v-model="server.serverUrl"
              placeholder="例如 play.example.com:25565"
            />
          </div>
        </div>
      </section>

      <div class="management-action-row">
        <MinecraftButtonClassic class="server-action-button" @click="cancelEditServer">
          取消
        </MinecraftButtonClassic>

        <MinecraftButtonClassic class="server-action-button" native-type="submit">
          保存服务器
        </MinecraftButtonClassic>
      </div>
    </form>
  </template>

  <MinecraftDialog title="编辑服务器 Logo" v-model="iconOptionsVisible">
    <div class="icon-options-container">
      <label class="icon-options-label" for="server-icon-url">图片地址</label>

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

  <MinecraftDialog
    title="删除服务器"
    v-model="deleteServerDialogVisible"
    @confirm="onConfirmDeleteServer"
  >
    <p>
      确定要删除
      <strong>{{ pendingDeleteServer?.name || '这个服务器' }}</strong>
      吗？
    </p>
    <p class="management-danger-text">删除后前台服务器列表将不再显示该服务器。</p>
  </MinecraftDialog>
</template>

<style lang="css" scoped>
.server-toolbar-button,
.server-action-button {
  width: 10rem;
}

.server-selected-text {
  margin-right: auto;
  color: rgba(255, 255, 255, 0.72);
  align-self: center;
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
  max-width: 12rem;
  object-fit: contain;
  user-select: none;
}

.server-image-picture {
  cursor: pointer;
  height: 6rem;
  width: fit-content;
  position: relative;
}

.server-image-picture::after {
  content: '';
  position: absolute;
  inset: 0;
  background-color: rgba(255, 255, 255, 0);
  transition: all 0.2s ease-in-out;
}

.server-image-picture:hover::after {
  background-color: rgba(255, 255, 255, 0.1);
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

@media screen and (max-width: 768px) {
  .server-toolbar-button,
  .server-action-button {
    width: 100%;
  }

  .server-selected-text {
    margin-right: 0;
  }

  .icon-options-input-container {
    flex-direction: column;
  }

  .icon-options-button {
    width: 100%;
  }
}
</style>
