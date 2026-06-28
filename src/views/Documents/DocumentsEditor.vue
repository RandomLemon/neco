<script lang="ts" setup>
import {
  DeleteDocumentFile,
  GetDocumentDetail,
  UpdateDocument,
  UploadDocumentFile,
} from '@/api/documents'
import type { NewsSegment } from '@/api/newslist'
import TreeViewer from '@/components/documents/TreeViewer.vue'
import CalendarIcon from '@/components/icons/CalendarIcon.vue'
import LoadNews from '@/components/icons/LoadNews.vue'
import UploadPdf from '@/components/icons/UploadPdf.vue'
import UserIcon from '@/components/icons/UserIcon.vue'
import PdfViewer from '@/components/PdfViewer.vue'
import MinecraftButton from '@/components/utils/MinecraftButton.vue'
import MinecraftButtonClassic from '@/components/utils/MinecraftButtonClassic.vue'
import MinecraftDialog from '@/components/utils/MinecraftDialog.vue'
import MinecraftInput from '@/components/utils/MinecraftInput.vue'
import MinecraftSwitch from '@/components/utils/MinecraftSwitch.vue'
import {
  MdEditor,
  MdPreview,
  NormalToolbar,
  type ExposeParam,
  type ToolbarNames,
} from 'md-editor-v3'
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'

const editorToolbars = ref<ToolbarNames[]>([
  'bold',
  'underline',
  'italic',
  '-',
  'title',
  'strikeThrough',
  'sub',
  'sup',
  'quote',
  'unorderedList',
  'orderedList',
  'task',
  '-',
  0,
  'codeRow',
  'code',
  'link',
  'image',
  'table',
  'mermaid',
  'katex',
  '-',
  'revoke',
  'next',
  'save',
  1,
  '=',
  'fullscreen',
  'pageFullscreen',
  'catalog',
])

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

const formatPdf = (pdfSrc: string): string => {
  return `!![pdf](${pdfSrc})\n`
}

const toast = useToast()
const router = useRouter()

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

const showPdfDialog = ref(false)
const pdfSrc = ref('')

const addPdfFile = () => {
  showPdfDialog.value = true
  pdfSrc.value = ''
}

const editorRef = ref<ExposeParam>()

const onSelectPdf = () => {
  showPdfDialog.value = false
  toast.info('上传中，请等待成功提示…')

  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.pdf'
  input.click()

  input.onchange = async () => {
    const file = input.files?.[0]
    if (file) {
      const result = await UploadDocumentFile(selectedDocumentId.value, file)
      if (result) {
        toast.success('上传 PDF 成功！')
        documentPdfFiles.value.push(result)
        editorRef.value?.insert(() => {
          return {
            targetValue: formatPdf(result),
          }
        })
      } else {
        toast.error(`上传 PDF 失败：！`)
      }
    }
  }
}

const addPdfFileConfirm = () => {
  if (pdfSrc.value.trim() === '') {
    toast.warning('请输入 PDF 链接！')
    return
  }
  showPdfDialog.value = false
  documentPdfFiles.value.push(pdfSrc.value)
  editorRef.value?.insert(() => {
    return {
      targetValue: formatPdf(pdfSrc.value),
    }
  })
}

const selectedDocumentId = ref('')

watch(selectedDocumentId, async (newVal) => {
  scrollTo('md-editor')
  const result = await GetDocumentDetail(newVal)
  if (result) {
    documentInstance.private = result.private
    documentInstance.name = result.name
    documentInstance.content = result.content || []
    documentInstance.contributors = result.contributors || []
    documentInstance.updateTime = result.updateTime || ''
    loadContent(result.content || [])
  } else {
    toast.error('获取文档详情失败！')
  }
})

const documentText = ref('')
const documentPdfFiles = ref<Array<string>>([])
const documentImgFiles = ref<Array<string>>([])
const documentInstance = reactive({
  private: false,
  preview: false,
  name: '',
  content: [] as NewsSegment[],
  contributors: [] as string[],
  updateTime: '',
})

const loadContent = (content: NewsSegment[]) => {
  let result = ''
  for (const segment of content) {
    switch (segment.type) {
      case 'markdown':
        result += segment.content + '\n'
        break
      case 'pdf_file':
        result += formatPdf(segment.content)
        documentPdfFiles.value.push(segment.content)
        break
      default:
        toast.error('神秘的正文类型！')
    }
  }
  documentText.value = result
}

const checkContent = async () => {
  let toRemove = []
  for (const key of documentPdfFiles.value) {
    if (!documentText.value.includes(key)) {
      toRemove.push(key)
      const result = await DeleteDocumentFile(selectedDocumentId.value, key)
      if (!result) {
        toast.warning(`已从服务器移除文件：${key}！`)
      } else {
        toast.error(`无法从服务器移除文件：${key}！`)
      }
    }
  }
  for (const key of toRemove) {
    documentPdfFiles.value = documentPdfFiles.value.filter((item) => item !== key)
  }

  toRemove = []
  for (const key of documentImgFiles.value) {
    if (!documentText.value.includes(key)) {
      toRemove.push(key)
      const result = await DeleteDocumentFile(selectedDocumentId.value, key)
      if (!result) {
        toast.warning(`已从服务器移除文件：${key}！`)
      } else {
        toast.error(`无法从服务器移除文件：${key}！`)
      }
    }
  }
  for (const key of toRemove) {
    documentImgFiles.value = documentImgFiles.value.filter((item) => item !== key)
  }
}

const onPreviewClick = () => {
  documentInstance.preview = !documentInstance.preview
  if (documentInstance.preview) {
    toContent()
    checkContent()
  } else {
    scrollTo('md-editor')
  }
}

const toContent = () => {
  const curText = documentText.value
  const result: NewsSegment[] = []

  if (documentPdfFiles.value.length === 0) {
    if (curText.trim() !== '') {
      result.push({ type: 'markdown', content: curText })
    }
    documentInstance.content = result
    return
  }

  const pdfKeysEscaped = documentPdfFiles.value.map((key) =>
    formatPdf(key).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  )

  const regex = new RegExp(`(${pdfKeysEscaped.join('|')})`, 'g')
  let lastIndex = 0
  let match

  while ((match = regex.exec(curText)) !== null) {
    const textSegment = curText.substring(lastIndex, match.index)
    if (textSegment.length > 0) {
      result.push({ type: 'markdown', content: textSegment })
    }

    result.push({ type: 'pdf_file', content: match[0].substring(8, match[0].length - 2) })

    lastIndex = regex.lastIndex
  }

  const remainingText = curText.substring(lastIndex)
  if (remainingText.trim() !== '') {
    result.push({ type: 'markdown', content: remainingText })
  }

  documentInstance.content = result
}

const saveDocument = () => {
  toContent()
  const blob = new Blob([JSON.stringify(documentInstance.content)], { type: 'text/plain' })
  const downloadLink = document.createElement('a')
  downloadLink.setAttribute('href', window.URL.createObjectURL(blob))
  downloadLink.setAttribute('download', 'save.nmo_document')

  downloadLink.click()
}

const loadDocument = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.nmo_document'
  input.click()

  input.onchange = async () => {
    const file = input.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        documentInstance.content = JSON.parse(result)
        loadContent(documentInstance.content)
        toast.success('加载本地存档完成！')
      }
      reader.readAsText(file)
    }
  }
}

const onUploadImg = async (
  files: Array<File>,
  callback: (urls: string[] | { url: string; alt: string; title: string }[]) => void,
) => {
  const res = await Promise.all(
    files.map(async (file) => {
      const result = await UploadDocumentFile(selectedDocumentId.value, file)
      if (result) {
        documentImgFiles.value.push(result)
        toast.success(`上传图片成功！`)
        return result
      } else {
        toast.error(`上传图片失败！`)
        return ''
      }
    }),
  )
  callback(res)
}

const commitDocument = async () => {
  toContent()
  const result = await UpdateDocument(
    selectedDocumentId.value,
    documentInstance.private,
    documentInstance.content,
  )
  if (!result) {
    toast.success('更新文档成功！')
  } else {
    toast.error('更新文档失败！')
  }
}

const isMobile = ref(false)

const onResize = () => {
  if (window.innerWidth < 768) {
    isMobile.value = true
  } else {
    isMobile.value = false
  }
}

onMounted(() => {
  const userGroup = localStorage.getItem('userGroup')
  if (!userGroup?.includes('admin') && !userGroup?.includes('document_admin')) {
    router.replace('/404')
  }
  if (window.innerWidth < 768) {
    isMobile.value = true
  }
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div
    class="documents-editor"
    :style="{
      flexDirection: isMobile ? `column` : `row`,
      padding: isMobile ? '0.5rem' : '0',
    }"
  >
    <div
      ref="resizeContainerRef"
      class="resizer-container"
      :style="{
        width: isMobile ? `100%` : `${resizeContainerWidth}px`,
        minWidth: `128px`,
        maxWidth: `1280px`,
      }"
    >
      <TreeViewer class="tree-viewer" v-model="selectedDocumentId" />
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
      <MinecraftButton :dark="true" class="back-btn" @click="router.push('/management/document')">
        ← 回到后台
      </MinecraftButton>
    </div>
    <div
      class="editor-container"
      :style="{
        width: isMobile ? '100%' : `calc(100vw - ${resizeContainerWidth}px)`,
      }"
    >
      <MdEditor
        ref="editorRef"
        id="md-editor"
        class="editor minecraft-md-editor"
        theme="dark"
        language="zh-CN"
        preview-theme="minecraft"
        :preview="false"
        :toolbars="editorToolbars"
        v-model="documentText"
        @on-remount="mountSounds"
        @on-save="saveDocument"
        @on-upload-img="onUploadImg"
        v-show="!documentInstance.preview"
      >
        <template #defToolbars>
          <NormalToolbar title="添加 PDF 文件" @on-click="addPdfFile">
            <UploadPdf class="md-editor-icon" />
          </NormalToolbar>
          <NormalToolbar title="加载本地存档" @on-click="loadDocument">
            <LoadNews class="md-editor-icon" />
          </NormalToolbar>
        </template>
      </MdEditor>
      <div class="document-main-content" v-show="documentInstance.preview">
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
            <MdPreview
              theme="dark"
              language="zh-CN"
              preview-theme="minecraft"
              :model-value="item.content"
              @on-remount="mountSounds"
              v-if="item.type === 'markdown'"
            />
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
      <div class="editor-command-bar">
        <section class="editor-status-card" aria-labelledby="editor-visibility-title">
          <div>
            <h2 id="editor-visibility-title">文档可见性</h2>
            <p>
              {{
                documentInstance.private
                  ? '当前为私有，仅内部可见。'
                  : '当前为公开，所有访问者可见。'
              }}
            </p>
          </div>

          <div class="editor-visibility-control" role="group" aria-label="切换文档可见性">
            <button
              type="button"
              class="editor-visibility-button"
              :class="{ active: !documentInstance.private }"
              @click="documentInstance.private = false"
            >
              公开
            </button>

            <button
              type="button"
              class="editor-visibility-button"
              :class="{ active: documentInstance.private }"
              @click="documentInstance.private = true"
            >
              私有
            </button>
          </div>
        </section>

        <section class="editor-status-card compact" aria-labelledby="editor-preview-title">
          <div>
            <h2 id="editor-preview-title">预览模式</h2>
            <p>{{ documentInstance.preview ? '正在预览最终效果。' : '正在编辑 Markdown。' }}</p>
          </div>

          <MinecraftSwitch
            id="editor-preview-switch"
            v-model="documentInstance.preview"
            @change="onPreviewClick"
          />
        </section>

        <MinecraftButton class="editor-save-button" :dark="true" @click="commitDocument">
          保存文档
        </MinecraftButton>
      </div>
    </div>
  </div>
  <MinecraftDialog title="添加 PDF 文件" v-model="showPdfDialog">
    <div class="pdf-options-container">
      <label class="pdf-options-label" for="document-pdf-url"> 文件地址 </label>

      <div class="pdf-options-input-container">
        <MinecraftInput
          id="document-pdf-url"
          class="pdf-options-input"
          v-model="pdfSrc"
          placeholder="填入 PDF 链接"
        />

        <MinecraftButtonClassic class="pdf-options-button" @click="addPdfFileConfirm">
          保存
        </MinecraftButtonClassic>
      </div>
    </div>
    <div class="pdf-options-container">
      <text class="pdf-options-label">直接上传</text>
      <MinecraftButtonClassic class="pdf-options-button" style="width: 10rem" @click="onSelectPdf">
        ↑ 点击上传</MinecraftButtonClassic
      >
    </div>
    <template v-slot:footer>
      <span></span>
    </template>
  </MinecraftDialog>
</template>

<style lang="css" scoped>
.resizer:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 2px;
}

.documents-editor {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
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
  position: relative;
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
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  height: 100vh;
  min-width: 0;
  overflow: auto;
  background:
    linear-gradient(to right, rgba(0, 0, 0, 0.68), rgba(0, 0, 0, 0.34), rgba(0, 0, 0, 0.68)),
    radial-gradient(circle at 50% 18%, rgba(108, 195, 73, 0.16), transparent 28rem),
    url('/background/bg.jpg');
  background-size: auto, auto, 468px;
}

.editor {
  height: 100%;
  min-height: 0;
}

.minecraft-md-editor {
  --md-bk-color: rgba(20, 20, 20, 0.96);
  --md-border-color: #555;
  --md-color: rgba(255, 255, 255, 0.88);
  border: 4px solid #222;
  box-shadow:
    inset -4px -4px 0 0 #1f1f1f,
    inset 4px 4px 0 0 #454545;
}

.minecraft-md-editor :deep(.md-editor-toolbar-wrapper) {
  min-height: 2rem;
  background-color: #2e2e2e;
  border-bottom: 2px solid #111;
}

.minecraft-md-editor :deep(.cm-editor) {
  font-size: 1.08rem;
  line-height: 1.75;
  background-color: #161616;
}

.minecraft-md-editor :deep(.cm-content) {
  padding: 1.25rem;
  font-family: 'Cubic 11', 'Ark Latin', system-ui, Avenir, Helvetica, Arial, sans-serif !important;
}

.minecraft-md-editor :deep(.md-editor-input-wrapper) {
  background:
    linear-gradient(to bottom, rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.22)),
    url('/blockbg/blackstone.png');
  background-size:
    auto,
    32px 32px;
}

.minecraft-md-editor :deep(.md-editor-preview-wrapper) {
  padding: 1.25rem;
  font-size: 1.05rem;
}

.editor-command-bar {
  display: grid;
  grid-template-columns: minmax(18rem, 1fr) minmax(14rem, 0.75fr) 10rem;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: #202020;
  border-top: 4px solid #111;
}

.editor-status-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-width: 0;
  padding: 0.75rem;
  background-color: #303030;
  border: 2px solid #1a1a1a;
  box-shadow:
    inset -2px -2px 0 0 #1f1f1f,
    inset 2px 2px 0 0 #454545;
}

.editor-status-card h2 {
  margin: 0 0 0.25rem 0;
  color: #fff;
  font-size: 1rem;
}

.editor-status-card p {
  margin: 0;
  color: rgba(255, 255, 255, 0.68);
  font-size: 0.82rem;
  line-height: 1.25rem;
}

.editor-visibility-control {
  display: inline-flex;
  gap: 0.35rem;
  flex-shrink: 0;
}

.editor-visibility-button {
  min-width: 4rem;
  padding: 0.45rem 0.6rem;
  color: #ddd;
  background-color: #222;
  border: 2px solid #111;
  box-shadow:
    inset -1px -1px 0 0 #111,
    inset 1px 1px 0 0 #666;
  cursor: pointer;
}

.editor-visibility-button.active {
  color: #fff;
  background-color: rgba(60, 133, 39, 0.7);
  border-color: var(--minecraft-green-light);
}

.editor-visibility-button:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 3px;
}

.editor-save-button {
  width: 100%;
  height: 100%;
  min-height: 4.4rem;
  font-size: 1.1rem;
}

.document-main-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: auto;
  min-height: 0;
  background:
    linear-gradient(to right, rgba(0, 0, 0, 0.72), rgba(0, 0, 0, 0.42), rgba(0, 0, 0, 0.72)),
    radial-gradient(circle at 50% 18%, rgba(108, 195, 73, 0.16), transparent 28rem),
    url('/background/bg.jpg');
  background-size: auto, auto, 468px;
}

.document-main-item-list {
  display: flex;
  flex-direction: column;
  width: min(100%, 68rem);
  min-height: 100%;
  padding: 2rem clamp(1rem, 4vw, 4rem);
  color: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(10px);
  background-color: rgba(12, 12, 12, 0.72);
  border: 4px solid #222;
  box-shadow:
    inset -4px -4px 0 0 #1f1f1f,
    inset 4px 4px 0 0 #454545,
    0 0.75rem 2rem rgba(0, 0, 0, 0.35);
  overflow: auto;
}

@media screen and (max-width: 1080px) {
  .editor-command-bar {
    grid-template-columns: 1fr;
  }

  .editor-save-button {
    min-height: 3.2rem;
  }
}

@media screen and (max-width: 768px) {
  .editor-container {
    height: auto;
    min-height: 100vh;
  }

  .editor-status-card {
    flex-direction: column;
    align-items: stretch;
  }

  .editor-visibility-control {
    width: 100%;
  }

  .editor-visibility-button {
    flex: 1;
  }
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
</style>
