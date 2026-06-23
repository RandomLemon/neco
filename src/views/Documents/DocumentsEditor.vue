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

const documentEditorRef = ref<HTMLDivElement | null>(null)

const documentEditorOffsetX = ref<number>(0)
const documentEditorOffsetY = ref<number>(0)

onMounted(() => {
  const userGroup = localStorage.getItem('userGroup')
  if (!userGroup?.includes('admin') && !userGroup?.includes('document_admin')) {
    router.replace('/404')
  }
  if (window.innerWidth < 768) {
    isMobile.value = true
  }
  if (documentEditorRef.value) {
    const parentScrollX = documentEditorRef.value.parentElement?.scrollLeft || window.scrollX,
      parentScrollY = documentEditorRef.value.parentElement?.scrollTop || window.scrollY
    documentEditorOffsetX.value =
      documentEditorRef.value.getBoundingClientRect().left + parentScrollX
    documentEditorOffsetY.value =
      documentEditorRef.value.getBoundingClientRect().top + parentScrollY
    const parent = documentEditorRef.value.parentElement || window
    parent.addEventListener('scroll', () => {
      if (documentEditorRef.value) {
        documentEditorOffsetX.value =
          documentEditorRef.value.getBoundingClientRect().left + parentScrollX
        documentEditorOffsetY.value =
          documentEditorRef.value.getBoundingClientRect().top + parentScrollY
      }
    })
  }
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div
    ref="documentEditorRef"
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
      <TreeViewer
        class="tree-viewer"
        v-model="selectedDocumentId"
        :offset-x="documentEditorOffsetX"
        :offset-y="documentEditorOffsetY"
      />
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
        class="editor"
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
      <div class="editor-btn-group">
        <MinecraftButton
          :dark="true"
          class="editor-btn"
          @click="documentInstance.private = !documentInstance.private"
          >可见性：{{ documentInstance.private ? '私有' : '公开' }}
        </MinecraftButton>
        <MinecraftButton :dark="true" class="editor-btn" @click="onPreviewClick"
          >预览：{{ documentInstance.preview ? '开启' : '关闭' }}
        </MinecraftButton>
        <MinecraftButton :dark="true" class="editor-btn last" @click="commitDocument"
          >保存</MinecraftButton
        >
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
  display: flex;
  flex-direction: column;
  height: 100vh;
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
  height: fit-content;
  overflow: scroll;
  min-height: calc(100vh - 2rem - 4px);

  background:
    linear-gradient(to right, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.4)),
    radial-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5)), url('/blockbg/dirt.png');
}

.document-main-item-list {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 1rem 4rem;
  padding-bottom: 2rem;
  min-height: calc(100vh - 2rem - 4px);
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
