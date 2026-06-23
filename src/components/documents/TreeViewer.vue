<script lang="ts" setup>
import {
  CreateDocument,
  DeleteDocument,
  GetDocumentLayer,
  RebindDocument,
  RenameDocument,
  type DocumentNode,
} from '@/api/documents'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import MinecraftButton from '../utils/MinecraftButton.vue'
import MinecraftDialog from '../utils/MinecraftDialog.vue'
import MinecraftInput from '../utils/MinecraftInput.vue'
import MinecraftSwitch from '../utils/MinecraftSwitch.vue'
import { useToast } from 'vue-toastification'
import { EventBus } from '@/eventbus/EventBus'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// Get query from route

const activeId = route.query.id as string

const toast = useToast()

const props = defineProps({
  parentId: {
    type: String,
    default: 'root',
  },
  id: {
    type: String,
    default: '',
  },
  layer: {
    type: Number,
    default: 0,
  },
  disableEdit: {
    type: Boolean,
    default: false,
  },
  offsetX: {
    type: Number,
    default: 0,
  },
  offsetY: {
    type: Number,
    default: 0,
  },
  parentFolderId: {
    type: String,
    default: 'root',
  },
})
const currentFolderId = computed(() => {
  return props.id || props.parentId || 'root'
})
const name = defineModel('name', {
  type: String,
  default: 'root',
})
const selectedId = defineModel({
  type: String,
  required: true,
})

watch(selectedId, () => {
  router.replace({
    query: {
      id: selectedId.value,
    },
  })
})

const children = ref<DocumentNode[]>([])
const doesExpand = ref(false)

const onExpand = async (force: boolean = false) => {
  if (children.value.length !== 0 && !force) {
    return
  }
  children.value = await GetDocumentLayer(props.parentId)
}

const toggleExpand = async () => {
  doesExpand.value = !doesExpand.value
  if (doesExpand.value) {
    await onExpand()
  }
}

let mouseX = 0,
  mouseY = 0
let menuX = 0,
  menuY = 0
const isGlobal = ref(false)

document.addEventListener('mousemove', (event: MouseEvent) => {
  mouseX = event.clientX
  mouseY = event.clientY
})

document.addEventListener('click', () => {
  folderMenuShow.value = false
  documentMenuShow.value = false
})

type InputTitle = 'none' | '新建文件夹' | '重命名文件夹' | '新建文档' | '重命名文档'
const inputTitle = ref<InputTitle>('none')
const inputDialogShow = ref(false)
const isPrivate = ref(false)
const input = ref('')
let curName = ''

const onInputDialogConfirm = async () => {
  if (input.value.trim() === '') {
    toast.warning('请输入名称！')
    return
  }
  inputDialogShow.value = false
  if (inputTitle.value === '新建文件夹') {
    const result = await CreateDocument({
      parentId: props.parentId,
      name: input.value,
      private: isPrivate.value,
      isFolder: true,
    })
    if (result) {
      toast.success('创建文件夹成功！')
      await onExpand(true)
    } else {
      toast.error(`创建文件夹失败！`)
    }
  } else if (inputTitle.value === '重命名文件夹') {
    const result = await RenameDocument(props.id, input.value)
    if (!result) {
      toast.success('重命名文件夹名称成功！')
      name.value = input.value
    } else {
      toast.error('重命名文件夹名称失败！')
    }
  } else if (inputTitle.value === '新建文档') {
    const result = await CreateDocument({
      parentId: props.parentId,
      name: input.value,
      private: isPrivate.value,
      isFolder: false,
    })
    if (result) {
      toast.success('创建文档成功！')
      await onExpand(true)
    } else {
      toast.error('创建文档失败！')
    }
  } else if (inputTitle.value === '重命名文档') {
    const result = await RenameDocument(selectedId.value, input.value)
    if (!result) {
      toast.success('重命名文档名称成功！')
      children.value.forEach((child) => {
        if (child.id === selectedId.value) {
          child.name = input.value
        }
      })
    } else {
      toast.error('重命名文档名称失败！')
    }
  }
}

const onNewFolder = () => {
  resetMenu()
  inputTitle.value = '新建文件夹'
  inputDialogShow.value = true
  isPrivate.value = false
  input.value = ''
}

const onRenameFolder = () => {
  resetMenu()
  inputTitle.value = '重命名文件夹'
  inputDialogShow.value = true
  isPrivate.value = false
  input.value = name.value
}

const onNewDocument = () => {
  resetMenu()
  inputTitle.value = '新建文档'
  inputDialogShow.value = true
  isPrivate.value = false
  input.value = ''
}

const onRenameDocument = () => {
  resetMenu()
  inputTitle.value = '重命名文档'
  inputDialogShow.value = true
  isPrivate.value = false
  input.value = curName
}

const deleteType = ref<'none' | 'folder' | 'document'>('none')
const deleteConfirmDialogShow = ref<boolean>(false)

const onDeleteFolder = () => {
  resetMenu()
  deleteType.value = 'folder'
  deleteConfirmDialogShow.value = true
}

const onDeleteDocument = () => {
  resetMenu()
  deleteType.value = 'document'
  deleteConfirmDialogShow.value = true
}

const onDeleteConfirm = async () => {
  if (deleteType.value === 'folder') {
    const result = await DeleteDocument(props.id)
    if (!result) {
      toast.success('删除文件夹成功！')
      document.getElementById(`root-${props.id}`)?.remove()
    } else {
      toast.error('删除文件夹失败！')
    }
  } else if (deleteType.value === 'document') {
    const result = await DeleteDocument(selectedId.value)
    if (!result) {
      toast.success('删除文档成功！')
      children.value = children.value.filter((child) => child.id !== selectedId.value)
    } else {
      toast.error('删除文档失败！')
    }
  }
}

const folderMenuRef = ref<HTMLDivElement | null>(null)
const folderMenuShow = ref(false)
const documentMenuRef = ref<HTMLDivElement | null>(null)
const documentMenuShow = ref(false)

const closeOwnMenu = () => {
  folderMenuShow.value = false
  documentMenuShow.value = false
}

const onCloseAllMenu = () => {
  closeOwnMenu()
}

type DragDropRefreshPayload = {
  parentIds: string[]
}

const getRefreshParentIds = (payload: unknown): string[] => {
  if (typeof payload === 'string') {
    return [payload || 'root']
  }

  if (
    payload &&
    typeof payload === 'object' &&
    'parentIds' in payload &&
    Array.isArray((payload as DragDropRefreshPayload).parentIds)
  ) {
    return (payload as DragDropRefreshPayload).parentIds.map((id) => id || 'root')
  }

  return []
}

const onDragDropRefresh = async (payload: unknown) => {
  const parentIds = getRefreshParentIds(payload)

  if (!parentIds.includes(currentFolderId.value)) {
    return
  }

  await onExpand(true)
}

const resetMenu = () => {
  EventBus.emit('TreeViewer::closeAllMenu')
  closeOwnMenu()

  menuX = mouseX - props.offsetX
  menuY = mouseY - props.offsetY
}

const onFolderMenu = (event: PointerEvent, global: boolean) => {
  if (props.disableEdit) {
    return
  }
  event.preventDefault()
  resetMenu()
  isGlobal.value = global
  folderMenuShow.value = true
  if (folderMenuRef.value) {
    const menuWidth = folderMenuRef.value.offsetWidth
    const menuHeight = folderMenuRef.value.offsetHeight
    if (menuX + menuWidth > window.innerWidth) {
      menuX = window.innerWidth - menuWidth
    }
    if (menuY + menuHeight > window.innerHeight) {
      menuY = window.innerHeight - menuHeight
    }
  }
}

const onDocumentMenu = (event: PointerEvent, filename: string, fileid: string) => {
  if (props.disableEdit) {
    return
  }
  event.preventDefault()
  curName = filename
  selectedId.value = fileid
  resetMenu()
  documentMenuShow.value = true
  if (documentMenuRef.value) {
    const menuWidth = documentMenuRef.value.offsetWidth
    const menuHeight = documentMenuRef.value.offsetHeight
    if (menuX + menuWidth > window.innerWidth) {
      menuX = window.innerWidth - menuWidth
    }
    if (menuY + menuHeight > window.innerHeight) {
      menuY = window.innerHeight - menuHeight
    }
  }
}

onMounted(async () => {
  EventBus.on('TreeViewer::closeAllMenu', onCloseAllMenu)
  EventBus.on('TreeViewer::dragDrop', onDragDropRefresh)

  if (activeId) {
    selectedId.value = activeId
  }

  if (props.parentId !== 'root') {
    return
  }

  await onExpand()
})

onUnmounted(() => {
  EventBus.off('TreeViewer::closeAllMenu', onCloseAllMenu)
  EventBus.off('TreeViewer::dragDrop', onDragDropRefresh)
})

const onFolderOver = (event: DragEvent) => {
  const dragParentId = event.dataTransfer?.getData('TreeViewer:drag-parent-id') || 'root'

  if (currentFolderId.value === dragParentId) {
    return
  }

  const elem = document.getElementById(`root-${props.id}`)
  elem?.classList.add('drag-hover')
}

const onFolderLeave = (event: DragEvent) => {
  const dragParentId = event.dataTransfer?.getData('TreeViewer:drag-parent-id') || 'root'

  if (currentFolderId.value === dragParentId) {
    return
  }

  const elem = document.getElementById(`root-${props.id}`)
  elem?.classList.remove('drag-hover')
}

const onDragDrop = async (event: DragEvent) => {
  const elem = document.getElementById(`root-${props.id}`)
  elem?.classList.remove('drag-hover')

  const dragType = event.dataTransfer?.getData('TreeViewer:drag-type') || ''
  const dragId = event.dataTransfer?.getData('TreeViewer:drag-id') || ''
  const dragParentId = event.dataTransfer?.getData('TreeViewer:drag-parent-id') || 'root'
  const targetParentId = currentFolderId.value

  if (!dragId) {
    return
  }

  if (dragId === targetParentId) {
    toast.warning('不能将文件夹移动到它自己里面！')
    return
  }

  if (dragParentId === targetParentId) {
    return
  }

  const result = await RebindDocument(dragId, targetParentId)

  if (!result) {
    toast.success(`移动${dragType}成功！`)

    EventBus.emit('TreeViewer::dragDrop', {
      parentIds: Array.from(new Set([dragParentId, targetParentId])),
    })
  } else {
    toast.error(`移动${dragType}失败！`)
  }
}

const onFolderMenuFromButton = (event: MouseEvent, global: boolean) => {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()

  resetMenu()
  isGlobal.value = global

  menuX = rect.left - props.offsetX
  menuY = rect.bottom - props.offsetY

  folderMenuShow.value = true
}

const onDocumentMenuFromButton = (event: MouseEvent, filename: string, fileid: string) => {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()

  curName = filename
  selectedId.value = fileid
  resetMenu()

  menuX = rect.left - props.offsetX
  menuY = rect.bottom - props.offsetY

  documentMenuShow.value = true
}

const onFolderDrag = async (event: DragEvent) => {
  event.dataTransfer?.setData('TreeViewer:drag-type', '文件夹')
  event.dataTransfer?.setData('TreeViewer:drag-id', currentFolderId.value)
  event.dataTransfer?.setData('TreeViewer:drag-parent-id', props.parentFolderId || 'root')
}

const onDocumentDrag = async (event: DragEvent, id: string) => {
  selectedId.value = id

  event.dataTransfer?.setData('TreeViewer:drag-type', '文档')
  event.dataTransfer?.setData('TreeViewer:drag-id', selectedId.value)
  event.dataTransfer?.setData('TreeViewer:drag-parent-id', currentFolderId.value)
}
</script>

<template>
  <div
    @dragover.prevent.stop="onFolderOver"
    @dragleave.prevent.stop="onFolderLeave"
    @drop.prevent.stop="onDragDrop"
    :id="`root-${props.id}`"
    style="user-select: none"
    @contextmenu.stop="onFolderMenu($event, true)"
  >
    <details
      class="document"
      @contextmenu.stop="onFolderMenu($event, false)"
      v-if="name !== 'root'"
    >
      <summary
        :draggable="props.disableEdit ? 'false' : 'true'"
        @dragstart="onFolderDrag"
        class="document-name"
        :style="{
          '--prefix': `${(layer + 1) * 0.8}rem`,
          '--bg-color': 'rgba(255, 255, 255, 0.1)',
        }"
        @click="toggleExpand"
      >
        <span style="z-index: 4">{{ name }}</span>

        <MinecraftButton
          v-if="!props.disableEdit"
          class="document-more-btn"
          :aria-label="`${name} 的更多操作`"
          aria-haspopup="menu"
          :aria-expanded="folderMenuShow"
          @click.stop.prevent="onFolderMenuFromButton($event, false)"
        >
          ⋯
        </MinecraftButton>
      </summary>
      <div v-for="child in children" :key="child.id">
        <TreeViewer
          v-if="child.isFolder"
          :parent-id="child.id"
          :parent-folder-id="currentFolderId"
          v-model:name="child.name"
          :id="child.id"
          :layer="props.layer + 1"
          v-model="selectedId"
          :disable-edit="props.disableEdit"
          :offset-x="props.offsetX"
          :offset-y="props.offsetY"
        />
        <details
          :id="`file-${child.id}`"
          class="document"
          @contextmenu.stop="onDocumentMenu($event, child.name, child.id)"
          @click="selectedId = child.id"
          v-else
        >
          <summary
            :draggable="props.disableEdit ? 'false' : 'true'"
            @dragstart="onDocumentDrag($event, child.id)"
            class="document-name file"
            :style="{
              '--prefix': `${(layer + 2) * 0.8}rem`,
              '--bg-color': `${selectedId === child.id ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'}`,
              '--display': `${selectedId === child.id ? 'block' : 'none'}`,
            }"
          >
            <span style="z-index: 4">{{ child.name }}</span>

            <MinecraftButton
              v-if="!props.disableEdit"
              class="document-more-btn"
              :aria-label="`${child.name} 的更多操作`"
              aria-haspopup="menu"
              :aria-expanded="documentMenuShow"
              @click.stop.prevent="onDocumentMenuFromButton($event, child.name, child.id)"
            >
              ⋯
            </MinecraftButton>
          </summary>
        </details>
      </div>
    </details>
    <div v-else>
      <div v-for="child in children" :key="child.id">
        <TreeViewer
          v-if="child.isFolder"
          :parent-id="child.id"
          :parent-folder-id="currentFolderId"
          v-model:name="child.name"
          :id="child.id"
          :layer="props.layer + 1"
          v-model="selectedId"
          :disable-edit="props.disableEdit"
          :offset-x="props.offsetX"
          :offset-y="props.offsetY"
        />
        <details
          :id="`file-${child.id}`"
          class="document"
          @contextmenu.stop="onDocumentMenu($event, child.name, child.id)"
          @click="selectedId = child.id"
          v-else
        >
          <summary
            :draggable="props.disableEdit ? 'false' : 'true'"
            @dragstart="onDocumentDrag($event, child.id)"
            class="document-name file"
            :style="{
              '--prefix': `${(layer + 2) * 0.8}rem`,
              '--bg-color': `${selectedId === child.id ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'}`,
              '--display': `${selectedId === child.id ? 'block' : 'none'}`,
            }"
          >
            <span style="z-index: 4">{{ child.name }}</span>

            <MinecraftButton
              v-if="!props.disableEdit"
              class="document-more-btn"
              :aria-label="`${child.name} 的更多操作`"
              aria-haspopup="menu"
              :aria-expanded="documentMenuShow"
              @click.stop.prevent="onDocumentMenuFromButton($event, child.name, child.id)"
            >
              ⋯
            </MinecraftButton>
          </summary>
        </details>
      </div>
    </div>
    <div
      ref="folderMenuRef"
      class="document-menu mc-border"
      v-if="folderMenuShow"
      role="menu"
      aria-label="文件夹操作菜单"
      @keydown.esc.stop.prevent="resetMenu"
      :style="{
        top: `${menuY}px`,
        left: `${menuX}px`,
      }"
    >
      <MinecraftButton
        :dark="true"
        class="document-menu-btn"
        role="menuitem"
        @click.stop="onNewDocument"
      >
        新建文档
      </MinecraftButton>

      <MinecraftButton
        :dark="true"
        class="document-menu-btn"
        role="menuitem"
        @click.stop="onNewFolder"
      >
        新建文件夹
      </MinecraftButton>

      <MinecraftButton
        :dark="true"
        v-if="!isGlobal && props.parentId !== 'root'"
        class="document-menu-btn"
        role="menuitem"
        @click.stop="onRenameFolder"
      >
        重命名
      </MinecraftButton>

      <MinecraftButton
        :dark="true"
        v-if="!isGlobal && props.parentId !== 'root'"
        class="document-menu-btn"
        role="menuitem"
        @click.stop="onDeleteFolder"
      >
        删除
      </MinecraftButton>
    </div>
    <div
      ref="documentMenuRef"
      class="document-menu mc-border"
      v-if="documentMenuShow"
      role="menu"
      aria-label="文档操作菜单"
      @keydown.esc.stop.prevent="resetMenu"
      :style="{
        top: `${menuY}px`,
        left: `${menuX}px`,
      }"
    >
      <MinecraftButton
        :dark="true"
        class="document-menu-btn"
        role="menuitem"
        @click.stop="onRenameDocument"
      >
        重命名
      </MinecraftButton>

      <MinecraftButton
        :dark="true"
        class="document-menu-btn"
        role="menuitem"
        @click.stop="onDeleteDocument"
      >
        删除
      </MinecraftButton>
    </div>
    <MinecraftDialog v-model="inputDialogShow" :title="inputTitle" @confirm="onInputDialogConfirm">
      <div class="dialog-input-item">
        <label class="dialog-input-label" for="document-private-switch"> 仅内部可见 </label>

        <MinecraftSwitch id="document-private-switch" v-model="isPrivate" />
      </div>

      <label class="dialog-input-label" for="document-name-input"> 名称 </label>

      <MinecraftInput
        id="document-name-input"
        class="dialog-input"
        v-model="input"
        placeholder="请输入名称"
        @keyup.enter="onInputDialogConfirm"
      />
    </MinecraftDialog>
    <MinecraftDialog
      v-model="deleteConfirmDialogShow"
      :title="deleteType === 'document' ? '删除文档' : '删除文件夹'"
      cancel-text="算了"
      confirm-text="没错！"
      @confirm="onDeleteConfirm"
    >
      <span class="delete-title"
        >确定要删除{{ deleteType === 'document' ? `文档 ${curName}` : `文件夹 ${name}` }} 吗？</span
      >
      <span class="delete-subtitle">它将会永远消失！（真的很久！）</span>
    </MinecraftDialog>
  </div>
</template>

<style lang="css" scoped>
.document-more-btn {
  z-index: 5;
  margin-left: auto;
  width: 2rem;
  min-width: 2rem;
  height: 1.5rem;
  font-size: 1rem;
  opacity: 0;
}

.document-name:hover .document-more-btn,
.document-name:focus-within .document-more-btn {
  opacity: 1;
}

.document-more-btn:focus-visible {
  opacity: 1;
  outline: 3px solid #fff;
  outline-offset: 2px;
}

.document-menu-btn:focus-visible {
  z-index: 8;
  outline: 3px solid #fff;
  outline-offset: -3px;
}

.document {
  padding-left: 0.8rem;
}

.document-name {
  display: flex;
  align-items: center;
  list-style: none;
  cursor: pointer;
  position: relative;
  user-select: none;
  text-wrap: nowrap;
}

.document-name:hover::after {
  position: absolute;
  content: '';
  width: calc(100% + 0.8rem + var(--prefix) - 24px);
  height: 100%;
  top: 0;
  left: calc(12px - var(--prefix));
  background-color: var(--bg-color);
  z-index: 2;
}

.document-name.file::after {
  display: var(--display);
  position: absolute;
  content: '';
  width: calc(100% + 0.8rem + var(--prefix) - 24px);
  height: 100%;
  top: 0;
  left: calc(12px - var(--prefix));
  background-color: var(--bg-color);
  z-index: 2;
}

.document-name.file:hover::after {
  display: block;
}

.document-name.file::before {
  background: none;
  clip-path: none;
}

.document-name::before {
  z-index: 4;
  content: '';
  display: block;
  height: 12px;
  width: 12px;
  background-color: white;
  clip-path: polygon(
    0% 0%,
    0% 25%,
    14.286% 25%,
    14.286% 50%,
    28.572% 50%,
    28.572% 75%,
    42.858% 75%,
    42.858% 100%,
    57.142% 100%,
    57.142% 75%,
    71.428% 75%,
    71.428% 50%,
    85.714% 50%,
    85.714% 25%,
    100% 25%,
    100% 0%,
    85.714% 0%,
    85.714% 25%,
    71.428% 25%,
    71.428% 50%,
    57.142% 50%,
    57.142% 75%,
    42.858% 75%,
    42.858% 50%,
    28.572% 50%,
    28.572% 25%,
    14.286% 25%,
    14.286% 0%
  );
  transform: scaleX(57.14%) rotate(-90deg);
  margin-right: 0.5rem;
  transition: transform 0.15s ease;
}

.document[open] > .document-name::before {
  transform: scaleY(57.14%) rotate(0deg);
}

.document-menu {
  position: absolute;
  top: 0;
  left: 0;
  width: 16rem;
  height: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 8;
}

.document-menu-btn {
  width: 100%;
  height: 2rem;
  font-size: 1.2rem;
}

.document-menu-btn:hover {
  z-index: 8;
}

.dialog-input {
  font-size: 1.2rem !important;
  padding: 4px !important;
}

.dialog-input-item {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.dialog-input-label {
  font-size: 1.2rem;
  width: 8rem;
  user-select: none;
  display: inline-block;
}

.delete-title {
  font-size: 1.5rem;
  user-select: none;
}

.delete-subtitle {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.6);
  user-select: none;
}

.drag-hover {
  position: relative;
}

.drag-hover::after {
  position: absolute;
  content: '';
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(152, 203, 132, 0.15);
}
</style>
