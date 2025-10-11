<script lang="ts" setup>
import MinecraftInput from '@/components/utils/MinecraftInput.vue'
import MinecraftTextarea from '@/components/utils/MinecraftTextarea.vue'
import { onMounted, reactive, ref } from 'vue'
import { useToast } from 'vue-toastification'
import '@vuepic/vue-datepicker/dist/main.css'
import MinecraftButtonClassic from '@/components/utils/MinecraftButtonClassic.vue'
import {
  type ExposeParam,
  MdEditor,
  MdPreview,
  NormalToolbar,
  type ToolbarNames,
} from 'md-editor-v3'
import MinecraftButton from '@/components/utils/MinecraftButton.vue'
import UploadPdf from '@/components/icons/UploadPdf.vue'
import MinecraftDialog from '@/components/utils/MinecraftDialog.vue'
import MinecraftSwitch from '@/components/utils/MinecraftSwitch.vue'
import {
  DeleteDocumentFile,
  GetAllCategories,
  GetAllTabs,
  GetDocument,
  GetDocuments,
  NewDocumentCategory,
  NewDocumentTab,
  RequireDocumentId,
  UpdateDocument,
  UploadDocumentFile,
  type DocumentBrief,
  type DocumentEntity,
} from '@/api/documents'
import type { NewsSegment } from '@/api/newslist'
import LoadNews from '@/components/icons/LoadNews.vue'

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
  'pageFullscreen',
  'catalog',
])

const soundOn = () => {
  const audio = new Audio('/button.click.ogg')
  audio.play()
  audio.volume = 0.3
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

const formatPdf = (pdfSrc: string): string => {
  return `!![pdf](${pdfSrc})\n`
}

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
      const result = await DeleteDocumentFile(documentContent.id, key)
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
      const result = await DeleteDocumentFile(documentContent.id, key)
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

const toContent = () => {
  let curText = documentText.value
  const result: NewsSegment[] = []
  for (const key of documentPdfFiles.value) {
    while (documentText.value.includes(key)) {
      const textSegment = curText.split(key)[0]
      curText = curText.split(key).slice(1).join(key)
      result.push({
        type: 'markdown',
        content: textSegment,
      })
      result.push({
        type: 'pdf_file',
        content: key,
      })
    }
  }
  if (curText.trim() !== '') {
    result.push({
      type: 'markdown',
      content: curText,
    })
  }
  documentContent.content = result
}

const toast = useToast()

const userGroup = ref(JSON.parse(localStorage.getItem('userGroup') || '[]'))

const scrollTo = (id: string) => {
  setTimeout(() => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }, 100)
}

const status = ref<'add' | 'edit' | 'none'>('none')

const documentContent = reactive<DocumentEntity>({
  id: '',
  title: '',
  description: '',
  category: '',
  tab: '',
  priority: 0,
  content: [] as NewsSegment[],
  contributor: localStorage.getItem('username') || '',
  private: false,
})

const documentText = ref('')
const documentPdfFiles = ref<Array<string>>([])
const documentImgFiles = ref<Array<string>>([])

const preview = ref(false)

const onAddDocument = async () => {
  status.value = 'add'
  documentContent.id = localStorage.getItem('documentId') || ''
  if (documentContent.id.trim() === '') {
    documentContent.id = (await RequireDocumentId()) || ''
    if (documentContent.id.trim() === '') {
      toast.error('创建文档失败！')
      status.value = 'none'
      return
    } else {
      localStorage.setItem('documentId', documentContent.id)
    }
  }
  documentText.value = ''
  documentPdfFiles.value = []
  documentImgFiles.value = []
}

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
      const result = await UploadDocumentFile(documentContent.id, file)
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
  documentPdfFiles.value.push(pdfSrc.value)
  editorRef.value?.insert(() => {
    return {
      targetValue: formatPdf(pdfSrc.value),
    }
  })
}

const saveDocument = () => {
  toContent()
  const blob = new Blob([JSON.stringify(documentContent.content)], { type: 'text/plain' })

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

  input.onchange = () => {
    const file = input.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        documentContent.content = JSON.parse(result)
        loadContent(documentContent.content)
        toast.success('加载本地存档完成！')
      }
      reader.readAsText(file)
    }
  }
}

const commitdocument = async () => {
  if (documentContent.id.trim() === '') {
    toast.error('文档 ID 不能为空！')
    return
  }
  if (documentContent.title.trim() === '') {
    toast.error('文档标题不能为空！')
    return
  }
  if (documentContent.description.trim() === '') {
    toast.error('文档描述不能为空！')
    return
  }
  if (documentText.value.length === 0) {
    toast.warning('请输入正文内容！')
    return
  }
  toContent()
  const result = await UpdateDocument(documentContent)
  if (result) {
    toast.error('上传文档失败！')
  } else {
    toast.success('上传文档成功！')
    if (documentContent.id === localStorage.getItem('documentId')) {
      localStorage.removeItem('documentId')
    }
  }
}

const onUploadImg = async (
  files: Array<File>,
  callback: (urls: string[] | { url: string; alt: string; title: string }[]) => void,
) => {
  const res = await Promise.all(
    files.map(async (file) => {
      const result = await UploadDocumentFile(documentContent.id, file)
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

const allCategories = ref<Array<string>>([])
const categoryActive = ref(-1)
const allTabs = ref<Array<string>>([])
const tabActive = ref(-1)
const documentBriefs = ref<Array<DocumentBrief>>([])
const documentActive = ref(-1)

const openDocument = async (index: number) => {
  documentActive.value = index
  const document = await GetDocument(documentBriefs.value[index].id)
  if (document) {
    status.value = 'edit'
    Object.assign(documentContent, document)
    loadContent(document.content)
  }
}

const onTabChange = async (index: number) => {
  tabActive.value = index
  documentContent.tab = allTabs.value[index]
  documentBriefs.value = await GetDocuments(
    allCategories.value[categoryActive.value],
    allTabs.value[index],
  )
}

const onCategoryChange = async (index: number) => {
  categoryActive.value = index
  documentContent.category = allCategories.value[index]
  allTabs.value = await GetAllTabs(allCategories.value[index])
  tabActive.value = 0
  await onTabChange(0)
}

const addCategory = ref('')
const addTab = ref('')

const onAddCategory = async () => {
  const result = await NewDocumentCategory(addCategory.value)
  if (result) {
    toast.error('新增分类失败！')
  } else {
    allCategories.value.push(addCategory.value)
    addCategory.value = ''
  }
}

const onAddTab = async () => {
  if (categoryActive.value === -1) {
    toast.warning('请先选择分类！')
    return
  }
  const result = await NewDocumentTab(allCategories.value[categoryActive.value], addTab.value)
  if (result) {
    toast.error('新增标签失败！')
  } else {
    allTabs.value.push(addTab.value)
    addTab.value = ''
  }
}

onMounted(async () => {
  allCategories.value = await GetAllCategories()
  categoryActive.value = -1
  tabActive.value = -1
})
</script>

<template>
  <div class="management-tab-title-container">
    <text class="management-tab-title">文档管理</text>
    <text class="management-tab-subtitle">你根本就不强</text>
  </div>
  <form class="management-tab-form">
    <div class="management-tab-form-item">
      <text class="management-tab-form-title">全部文档</text>
      <text class="management-tab-form-subtitle">{{ (userGroup.includes('admin') || userGroup.includes('document_admin')) ? '点击文档以编辑！' : '点击文档以预览！' }}</text>
    </div>
    <div class="document-list-container">
      <div class="document-list mc-border">
        <div
          class="document-list-item"
          v-for="category, index in allCategories"
          :key="index"
          :active="index === categoryActive ? 'true' : 'false'"
          @click="onCategoryChange(index)"
        >
          {{ category }}
        </div>
        <div class="document-list-input-item">
          <MinecraftInput
            class="document-list-input"
            v-model="addCategory"
            @keyup.enter="onAddCategory"
          />
          <MinecraftButtonClassic
            class="document-list-add"
            v-if="userGroup.includes('admin') || userGroup.includes('document_admin')"
            @click="onAddCategory"
          >新增分类</MinecraftButtonClassic>
        </div>
      </div>
      <div class="document-list mc-border">
        <div
          class="document-list-item"
          v-for="tab, index in allTabs"
          :key="index"
          :active="index === tabActive ? 'true' : 'false'"
          @click="onTabChange(index)"
        >
          {{ tab }}
        </div>
        <div class="document-list-input-item">
          <MinecraftInput
            class="document-list-input"
            v-model="addTab"
            @keyup.enter="onAddTab"
          />
          <MinecraftButtonClassic
            class="document-list-add"
            v-if="userGroup.includes('admin') || userGroup.includes('document_admin')"
            @click="onAddTab"
          >新增分类</MinecraftButtonClassic>
        </div>
      </div>
      <div class="document-list mc-border">
        <div
          class="document-list-item"
          v-for="documentBrief, index in documentBriefs"
          :key="index"
          :active="index === documentActive ? 'true' : 'false'"
          @click="openDocument(index)"
        >
          {{ documentBrief.title }}
        </div>
        <div class="document-list-input-item">
          <MinecraftButtonClassic
            class="document-list-add"
            @click="onAddDocument"
            v-if="userGroup.includes('admin') || userGroup.includes('document_admin')"
            >新建文档</MinecraftButtonClassic
          >
        </div>
      </div>
    </div>
  </form>
  <form
    id="edit-document"
    style="margin-bottom: 100vh"
    class="management-tab-form"
    v-if="
      status !== 'none' && (userGroup.includes('admin') || userGroup.includes('document_admin'))
    "
  >
    <text class="management-tab-form-title">{{ status === 'edit' ? '编辑' : '新增' }}文档</text>
    <div class="document-input-item">
      <text class="document-input-label">私有</text>
      <text style="user-select: none; font-size: 0.8rem; color: #ccc">是否仅站内用户可见</text>
      <MinecraftSwitch v-model="documentContent.private" />
    </div>
    <div class="document-input-item">
      <text class="document-input-label">ID</text>
      <MinecraftInput v-model="documentContent.id" class="document-input" disabled="true" />
    </div>
    <div class="document-input-item">
      <text class="document-input-label">分类</text>
      <MinecraftInput v-model="documentContent.category" class="document-input" disabled="true" />
    </div>
    <div class="document-input-item">
      <text class="document-input-label">页签</text>
      <MinecraftInput v-model="documentContent.tab" class="document-input" disabled="true" />
    </div>
    <div class="document-input-item">
      <text class="document-input-label">标题</text>
      <MinecraftInput
        class="document-input"
        v-model="documentContent.title"
        placeholder="请输入标题"
      />
    </div>
    <div class="document-input-item">
      <text class="document-input-label">简介</text>
      <MinecraftTextarea
        v-model="documentContent.description"
        class="document-input"
        style="resize: vertical"
        wrap="soft"
        placeholder="简介不宜过长！"
      />
    </div>
    <div class="document-input-item">
      <text class="document-input-label">正文</text>
      <div class="document-markdown-edit">
        <div class="document-button-group">
          <MinecraftButtonClassic
            class="document-button"
            :activated="!preview"
            @click="((preview = false), scrollTo('md-editor'))"
            >编辑</MinecraftButtonClassic
          >
          <MinecraftButtonClassic
            class="document-button"
            :activated="preview"
            @click="((preview = true), toContent(), checkContent())"
            >预览</MinecraftButtonClassic
          >
        </div>
        <MdEditor
          ref="editorRef"
          id="md-editor"
          style="height: 100vh"
          v-show="!preview"
          theme="dark"
          language="zh-CN"
          preview-theme="minecraft"
          :toolbars="editorToolbars"
          v-model="documentText"
          @on-remount="mountSounds"
          @on-save="saveDocument"
          :preview="false"
          @on-upload-img="onUploadImg"
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
        <div class="document-main-content" v-show="preview">
          <div class="document-main-item-list">
            <div
              class="document-main-item"
              v-for="(item, index) in documentContent.content"
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
              <iframe
                :id="`pdf-renderer-${index}`"
                v-if="item.type === 'pdf_file'"
                class="pdf-renderer mc-border"
                :src="`/pdfjs/web/viewer.html?file=${encodeURIComponent(item.content)}`"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    <MinecraftButtonClassic @click="commitdocument">保存</MinecraftButtonClassic>
  </form>
  <MinecraftDialog title="添加 PDF 文件" v-model="showPdfDialog">
    <div class="pdf-options-container">
      <text class="pdf-options-label">文件地址</text>
      <div class="pdf-options-input-container">
        <MinecraftInput class="pdf-options-input" v-model="pdfSrc" placeholder="填入 PDF 链接" />
        <MinecraftButtonClassic class="pdf-options-button" @click="addPdfFileConfirm"
          >保存</MinecraftButtonClassic
        >
      </div>
    </div>
    <div class="pdf-options-container">
      <text class="pdf-options-label">直接上传</text>
      <MinecraftButtonClassic class="pdf-options-button" style="width: 10rem" @click="onSelectPdf"
        ><span style="font-size: 2rem">↑</span> 点击上传</MinecraftButtonClassic
      >
    </div>
    <template v-slot:footer>
      <span></span>
    </template>
  </MinecraftDialog>
</template>

<style lang="css" scoped>
.document-input-item {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.document-input-label {
  user-select: none;
  font-size: 1.2rem;
  color: #fff;
  text-wrap: nowrap;
}

.document-input {
  font-size: 1rem;
  width: 100%;
  min-width: 5rem;
}

.document-button-group {
  display: flex;
  align-items: center;
  user-select: none;
  width: 100%;
}

.document-markdown-edit {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.document-button-group {
  display: flex;
  align-items: center;
}

.document-button {
  font-size: 1.2rem;
  width: 6rem;
}

.document-main-content {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: fit-content;

  background:
    linear-gradient(to right, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.4)),
    radial-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5)), url('/blockbg/dirt.png');
}

.document-main-item-list {
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 1rem 4rem;
  padding-bottom: 2rem;
}

.document-main-item {
  width: 100%;
  margin: 1rem 0;
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

.document-image {
  height: 6rem;
  width: auto;
  user-select: none;
}

.document-image-picture {
  cursor: pointer;
  height: 6rem;
  width: min-content;
  position: relative;
}

.document-image-picture::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  background-color: rgba(255, 255, 255, 0);
  transition: all 0.2s ease-in-out;
}

.document-image-picture:hover::after {
  background-color: rgba(255, 255, 255, 0.1);
}

.document-list-container {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.document-list {
  max-width: 100%;
  min-width: 256px;
  min-height: 24rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.document-list-input-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-top: auto;
  gap: 4px;
}

.document-list-add {
  font-size: 1.2rem;
}

.document-list-input {
  width: calc(100% - 4px);
}

.document-list-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  user-select: none;
  height: 2.5rem;
  font-size: 1.2rem;
}

.document-list-item[active="true"] {
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid white;
}
</style>

<style lang="css">
.dp__input {
  border-radius: 0;
  background-color: #616161;
  outline: 2px solid black;
  border: 2px solid;
  border-image: url('/UI/text-input.png') 1;
}

.dp__input_icon {
  color: white;
}

.md-editor-toolbar-wrapper {
  background-color: black;
}

.md-editor-footer {
  background-color: black;
}
</style>
