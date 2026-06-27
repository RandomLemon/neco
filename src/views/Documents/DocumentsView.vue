<script lang="ts" setup>
import { GetDocumentDetail } from '@/api/documents'
import type { NewsSegment } from '@/api/newslist'
import TreeViewer from '@/components/documents/TreeViewer.vue'
import CalendarIcon from '@/components/icons/CalendarIcon.vue'
import UserIcon from '@/components/icons/UserIcon.vue'
import PdfViewer from '@/components/PdfViewer.vue'
import MinecraftButton from '@/components/utils/MinecraftButton.vue'
import { MdCatalog, MdPreview } from 'md-editor-v3'
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'

const soundOn = () => {
  const audio = new Audio('/button.click.ogg')
  audio.volume = 0.3
  audio.play().catch(() => {})
}

const mountSounds = () => {
  // mount audios
  const buttons = document.querySelectorAll(
    '.md-editor-copy-button, .md-editor-collapse-tips, .md-editor-code-flag',
  )
  buttons.forEach((button) => {
    button.addEventListener('click', soundOn)
  })
}

const scrollTo = (id: string) => {
  setTimeout(() => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }, 100)
}

const toast = useToast()

const resizeContainerWidth = ref(320)
const resizeContainerRef = ref<HTMLDivElement | null>(null)

const resizeByKeyboard = (delta: number) => {
  const nextWidth = resizeContainerWidth.value + delta

  if (nextWidth < 128) {
    resizeContainerWidth.value = 128
    return
  }

  if (nextWidth > 1280) {
    resizeContainerWidth.value = 1280
    return
  }

  resizeContainerWidth.value = nextWidth
}

let isResizing = false
let startX = 0
let startWidth = 0

const startResize = (event: MouseEvent) => {
  if (!resizeContainerRef.value) {
    return
  }
  isResizing = true

  startX = event.clientX
  startWidth = resizeContainerRef.value.offsetWidth

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', stopResize)
}

const handleMouseMove = (event: MouseEvent) => {
  if (!isResizing) {
    return
  }
  const deltaX = event.clientX - startX
  let newWidth = startWidth + deltaX
  if (newWidth < 128) {
    newWidth = 128
  } else if (newWidth > 1280) {
    newWidth = 1280
  }

  resizeContainerWidth.value = newWidth
}

const stopResize = () => {
  if (!isResizing) {
    return
  }
  isResizing = false
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', stopResize)
}

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', stopResize)
})

const selectedDocumentId = ref('')

watch(selectedDocumentId, async (newVal) => {
  const result = await GetDocumentDetail(newVal)
  if (result) {
    documentInstance.private = result.private
    documentInstance.name = result.name
    documentInstance.content = result.content || []
    documentInstance.contributors = result.contributors || []
    documentInstance.updateTime = result.updateTime || ''
  } else {
    toast.error('获取文档详情失败！')
  }
})

const documentInstance = reactive({
  private: false,
  name: '',
  content: [] as NewsSegment[],
  contributors: [] as string[],
  updateTime: '',
})

const isMobile = ref(false)

const onResize = () => {
  if (window.innerWidth < 768) {
    isMobile.value = true
  } else {
    isMobile.value = false
  }
}

const bgCount = 62
let box: HTMLElement | null = null
const pool: Array<string> = []
const stayTime = 8000
const fadeTime = 400
const unloadedImages: Array<string> = []

const preloadImage = async (url: string) => {
  if (unloadedImages.includes(url)) {
    unloadedImages.splice(unloadedImages.indexOf(url), 1)
  } else {
    return
  }
  const promise = new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = resolve
    img.onerror = reject
    img.src = url
  })
  await promise
}

const nextBg = (first: boolean = false) => {
  if (box == null) {
    return
  }
  if (pool.length === 0) {
    for (let i = 1; i <= bgCount; i++) {
      pool.push(import.meta.env.BASE_URL + `mc自然风景背景图-air/${i}.jpg`)
    }
  }

  const idx = Math.floor(Math.random() * pool.length)
  const url = pool.splice(idx, 1)[0]
  preloadImage(url)

  box.style.opacity = '0'
  if (first) {
    box.style.backgroundImage = `url(${url})`
    box.style.opacity = '1'
  }
  setTimeout(() => {
    if (box == null) {
      return
    }
    box.style.backgroundImage = `url(${url})`
    box.style.opacity = '1'

    setTimeout(nextBg, stayTime + fadeTime)
  }, fadeTime)
}

onMounted(() => {
  // 背景轮播
  box = document.getElementById('documents-bg')
  for (let i = 1; i <= bgCount; i++) {
    unloadedImages.push(import.meta.env.BASE_URL + `mc自然风景背景图-air/${i}.jpg`)
  }
  nextBg(true)

  if (window.innerWidth < 768) {
    isMobile.value = true
  }
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})

const scrollElement = document.documentElement
</script>

<template>
  <div id="documents-bg"></div>
  <div class="navbar-cover"></div>
  <div
    class="documents-editor"
    :style="{
      flexDirection: isMobile ? `column` : `row`,
    }"
  >
    <div class="documents-editor-container">
      <div
        ref="resizeContainerRef"
        class="resizer-container"
        :style="{
          width: isMobile ? `100%` : `${resizeContainerWidth}px`,
          minWidth: `128px`,
          maxWidth: `1280px`,
        }"
      >
        <TreeViewer class="tree-viewer" v-model="selectedDocumentId" :disable-edit="true" />
        <div
          class="resizer"
          role="separator"
          tabindex="0"
          aria-orientation="vertical"
          aria-label="调整文档目录宽度"
          :aria-valuemin="128"
          :aria-valuemax="1280"
          :aria-valuenow="resizeContainerWidth"
          @mousedown.prevent="startResize"
          @keydown.left.exact.prevent="resizeByKeyboard(-16)"
          @keydown.right.exact.prevent="resizeByKeyboard(16)"
          @keydown.shift.left.prevent="resizeByKeyboard(-64)"
          @keydown.shift.right.prevent="resizeByKeyboard(64)"
          v-if="!isMobile"
        />
      </div>
      <div
        class="editor-container"
        :style="{
          width: isMobile ? '100%' : `calc(100vw - ${resizeContainerWidth}px)`,
        }"
      >
        <div class="document-main-content" id="md-editor">
          <div class="document-main-item-list">
            <div class="document-title" v-if="selectedDocumentId.trim() !== ''">
              {{ documentInstance.name }}
            </div>
            <div class="document-desc-item" v-if="selectedDocumentId.trim() !== ''">
              <UserIcon class="document-desc-icon" />
              <span>{{ documentInstance.contributors.join(', ') }}</span>
            </div>
            <div class="document-desc-item" v-if="selectedDocumentId.trim() !== ''">
              <CalendarIcon class="document-desc-icon" />
              <span>{{ documentInstance.updateTime }}</span>
            </div>
            <div
              class="document-main-item"
              v-for="(item, index) in documentInstance.content"
              :key="index"
            >
              <div class="document-preview">
                <MdPreview
                  :id="`md-preview-${index}`"
                  theme="dark"
                  language="zh-CN"
                  preview-theme="minecraft"
                  :model-value="item.content"
                  @on-remount="mountSounds"
                  v-if="item.type === 'markdown'"
                />
                <MdCatalog
                  class="document-preview-catalog"
                  :editor-id="`md-preview-${index}`"
                  :scroll-element="scrollElement"
                />
              </div>
              <MinecraftButton
                v-if="item.type === 'pdf_file'"
                class="pdf-read-btn"
                @click="scrollTo(`pdf-renderer-${index}`)"
                >↓ 最佳阅读位置</MinecraftButton
              >
              <PdfViewer
                :id="`pdf-renderer-${index}`"
                v-if="item.type === 'pdf_file'"
                class="pdf-renderer mc-border"
                :pdf-url="item.content"
                :title="`${documentInstance.name || '文档'} PDF 预览`"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
.resizer:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 2px;
}

#documents-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -2;

  background-size: cover;
  background-position: center;
  transition: opacity 0.4s ease-in-out;
}

.navbar-cover {
  position: absolute;
  top: 0;
  left: 0;
  height: 5rem;
  width: 100vw;
  z-index: -1;

  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(0, 0, 0, 0.5) 50%,
    rgba(0, 0, 0, 0.7) 100%
  );
}

.documents-editor {
  display: flex;
  width: 100vw;
  min-height: 100vh;
  padding-top: 5rem;
}

.documents-editor-container {
  display: flex;
  width: 100vw;
  min-height: calc(100vh - 5rem);
  padding: 0 4rem;
  padding-bottom: 2rem;

  background-color: rgba(0, 0, 0, 0.7);
}

.tree-viewer {
  flex: 1;
  width: 100%;
  overflow: auto;
  padding: 0.8rem;
  padding-left: 4px;
  padding-right: 4px;
  border: 4px solid #222222;
  box-shadow:
    inset -4px -4px 0px 0px #3a3a3a,
    inset 4px 4px 0px 0px #6b6b6b;
  background-color: #111111;
}

.resizer-container {
  position: sticky;
  top: 0;
  left: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.resizer {
  position: absolute;
  width: 8px;
  top: 0;
  right: 0;
  bottom: 0;
  cursor: ew-resize;
}

.back-btn {
  height: 2rem;
}

.pdf-options-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.pdf-options-label {
  font-size: 1.2rem;
  user-select: none;
}

.pdf-options-input-container {
  display: flex;
  gap: 1rem;
}

.pdf-options-input {
  font-size: 1rem;
  padding: 0.5rem;
  width: 100%;
  margin: auto;
}

.pdf-options-button {
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

.editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 5rem);
}

.editor {
  height: calc(100vh - 2rem - 4px);
}

.editor-btn-group {
  width: 100%;
  display: flex;
  align-items: center;
}

.editor-btn {
  width: fit-content;
  height: 2rem;
}

.editor-btn.last {
  width: 6rem;
  margin-left: auto;
}

.document-main-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
}

.document-main-item-list {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: max-content;
  padding: 1rem 4rem;
  padding-bottom: 2rem;
  min-height: 100vh;

  backdrop-filter: blur(10px);
  background-color: rgba(0, 0, 0, 0.3);
  border: 4px solid #222222;
  box-shadow:
    inset -4px -4px 0px 0px #3a3a3a,
    inset 4px 4px 0px 0px #6b6b6b;
}

.document-main-item {
  width: 100%;
  margin: 1rem 0;
}

.document-title {
  font-size: 1.5rem;
}

.document-desc-item {
  display: flex;
  align-items: center;
  margin-top: 0.8rem;
  gap: 0.8rem;
}

.document-desc-icon {
  width: 1rem;
  height: 1rem;
}

.document-preview-catalog {
  min-width: 20%;
  height: min-content;

  position: sticky;
  top: 5rem;
  left: 0;
}

.document-preview {
  display: flex;
  justify-content: space-between;
  position: relative;
  gap: 1rem;
}

@media screen and (max-width: 768px) {
  .document-preview {
    flex-direction: column-reverse;
    align-items: center;
    justify-content: center;
  }

  .documents-editor-container {
    flex-direction: column;
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .resizer-container {
    position: relative;
    height: 50vh;
  }

  .document-preview-catalog {
    width: 100%;
    border-bottom: 2px solid #909399;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    top: 0;

    position: relative;
  }
}
</style>

<style lang="css">
.md-editor-catalog-container {
  padding-left: 2rem;
  border-left: 2px solid #909399;
}

.md-editor-catalog-indicator {
  transform: translateX(2rem);
}

@media screen and (max-width: 768px) {
  .md-editor-catalog-container {
    padding-left: 2rem;
    border-left: none;
  }

  .md-editor-catalog-indicator {
    transform: translateX(2rem);
  }
}
</style>
