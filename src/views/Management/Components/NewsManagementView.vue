<script lang="ts" setup>
import {
  CreateNews,
  DeleteFile,
  GetNewsDetail,
  UpdateNews,
  UploadFile,
  type NewsSegment,
  type NewsTarget,
} from '@/api/newslist'
import MinecraftInput from '@/components/utils/MinecraftInput.vue'
import MinecraftTextarea from '@/components/utils/MinecraftTextarea.vue'
import NewsList from '@/views/News/NewsList.vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import Datepicker from '@vuepic/vue-datepicker'
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
import LoadNews from '@/components/icons/LoadNews.vue'
import MinecraftSwitch from '@/components/utils/MinecraftSwitch.vue'
import PlusIcon from '@/components/icons/PlusIcon.vue'

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

const formatDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = ('0' + (date.getMonth() + 1)).slice(-2)
  const day = ('0' + date.getDate()).slice(-2)
  return `${year}-${month}-${day}`
}

const nextYear = (date: Date): string => {
  const year = date.getFullYear() + 1
  const month = ('0' + (date.getMonth() + 1)).slice(-2)
  const day = ('0' + date.getDate()).slice(-2)
  return `${year}-${month}-${day}`
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
        newsPdfFiles.value.set(formatPdf(segment.content), segment.content)
        break
      default:
        toast.error('神秘的正文类型！')
    }
  }
  newsText.value = result
}

const checkContent = async () => {
  const toRemove = []
  for (const key of newsPdfFiles.value.keys()) {
    if (!newsText.value.includes(key)) {
      toRemove.push(key)
      const result = await DeleteFile(newsId.value, newsPdfFiles.value.get(key) as string)
      if (!result) {
        toast.warning(`已从服务器移除文件：${newsPdfFiles.value.get(key) as string}！`)
      } else {
        toast.error(`无法从服务器移除文件：${newsPdfFiles.value.get(key) as string}！`)
      }
    }
  }
  for (const key of toRemove) {
    newsPdfFiles.value.delete(key)
  }
}

const toContent = () => {
  let curText = newsText.value
  const result: NewsSegment[] = []
  for (const key of newsPdfFiles.value.keys()) {
    while (newsText.value.includes(key)) {
      const textSegment = curText.split(key)[0]
      curText = curText.split(key).slice(1).join(key)
      result.push({
        type: 'markdown',
        content: textSegment,
      })
      result.push({
        type: 'pdf_file',
        content: newsPdfFiles.value.get(key) as string,
      })
    }
  }
  if (curText.trim() !== '') {
    result.push({
      type: 'markdown',
      content: curText,
    })
  }
  newsContent.value = result
}

const router = useRouter()
const toast = useToast()

const viewType = ref<NewsTarget>('information')

const userGroup = ref(JSON.parse(localStorage.getItem('userGroup') || '["admin"]'))

const scrollTo = (id: string) => {
  setTimeout(() => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }, 100)
}

const scrollToNews = () => {
  if (userGroup.value.includes('admin') || userGroup.value.includes('news_admin')) {
    scrollTo('edit-news')
    return
  }
  scrollTo('news-list-manage')
}

const status = ref<'add' | 'edit' | 'none'>('edit')

const onNewsClick = async (id: string) => {
  if (userGroup.value.includes('admin') || userGroup.value.includes('news_admin')) {
    // Edit
    status.value = 'edit'
    newsId.value = id
    const result = await GetNewsDetail(id)
    if (result) {
      newsTitle.value = result.entity.title
      newsBrief.value = result.entity.brief
      newsContent.value = result.content
      newsPin.value = result.entity.pin
      newsType.value = result.category as NewsTarget
      newsDate.value = result.entity.date
      newsEndDate.value = result.entity.endDate

      loadContent(result.content)
    } else {
      toast.warning('获取新闻详情失败！')
    }
  } else {
    const target = router.resolve(`/news/detail/${id}`)
    window.open(target.href, '_blank')
  }
}

const newsId = ref('')
const newsTitle = ref('')
const newsBrief = ref('')
const newsContent = ref<NewsSegment[]>([])
const newsText = ref('')
const newsPdfFiles = ref(new Map())
const newsPin = ref(false)
const newsImage = ref('')
const newsType = ref<NewsTarget>('information')
const newsDate = ref(formatDate(new Date()))
const newsEndDate = ref<string | undefined>(nextYear(new Date()))

const preview = ref(false)

const coverUploadVisible = ref(false)

const onCoverUpload = async () => {
  newsImage.value = ''
  coverUploadVisible.value = true
}

const onSelectImage = async () => {
  coverUploadVisible.value = false
  toast.info('上传中，请等待成功提示…')

  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.click()

  input.onchange = async () => {
    const file = input.files?.[0]
    if (file) {
      const result = await UploadFile(newsId.value, file)
      if (result) {
        toast.success('上传封面成功！')
      } else {
        toast.error(`上传封面失败：${result}！`)
      }
    }
  }
}

const onAddNews = async () => {
  status.value = 'add'
  newsId.value = localStorage.getItem('newsId') || ''
  if (newsId.value.trim() === '') {
    newsId.value = (await CreateNews()) || ''
    if (newsId.value.trim() === '') {
      toast.error('创建文章失败！')
      status.value = 'none'
      return
    } else {
      localStorage.setItem('newsId', newsId.value)
    }
  }
  newsTitle.value = ''
  newsBrief.value = ''
  newsContent.value = []
  newsImage.value = ''
  newsText.value = ''
  newsPdfFiles.value.clear()
  newsPin.value = false
  newsType.value = 'information'
  newsDate.value = formatDate(new Date())
  newsEndDate.value = nextYear(new Date())
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
      const result = await UploadFile(newsId.value, file)
      if (result) {
        toast.success('上传 PDF 成功！')
        newsPdfFiles.value.set(formatPdf(result), result)
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
  newsPdfFiles.value.set(formatPdf(pdfSrc.value), pdfSrc.value)
  editorRef.value?.insert(() => {
    return {
      targetValue: formatPdf(pdfSrc.value),
    }
  })
}

const saveNews = () => {
  toContent()
  const blob = new Blob([JSON.stringify(newsContent.value)], { type: 'text/plain' })

  const downloadLink = document.createElement('a')
  downloadLink.setAttribute('href', window.URL.createObjectURL(blob))
  downloadLink.setAttribute('download', 'save.nmo_news')

  downloadLink.click()
}

const loadNews = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.nmo_news'
  input.click()

  input.onchange = () => {
    const file = input.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        newsContent.value = JSON.parse(result)
        loadContent(newsContent.value)
        toast.success('加载本地存档完成！')
      }
      reader.readAsText(file)
    }
  }
}

const commitNews = async () => {
  if (newsTitle.value.trim() === '') {
    toast.warning('请输入标题！')
    return
  }
  if (newsBrief.value.trim() === '') {
    toast.warning('请输入简介！')
    return
  }
  if (newsImage.value.trim() === '') {
    toast.warning('请上传封面！')
    return
  }
  if (newsText.value.length === 0) {
    toast.warning('请输入正文内容！')
    return
  }
  if (newsDate.value.trim() === '') {
    toast.warning('请输入开始时间！')
    return
  }
  if (newsType.value.trim() === '') {
    toast.warning('请选择类型！')
    return
  }
  toContent()
  const result = await UpdateNews(
    newsId.value,
    newsType.value,
    {
      title: newsTitle.value,
      pin: newsPin.value,
      brief: newsBrief.value,
      date: newsDate.value,
      endDate: newsEndDate.value,
      image: '',
    },
    newsContent.value,
  )
  if (result) {
    toast.error('上传文章失败！')
  } else {
    toast.success('上传文章成功！')
    if (newsId.value === localStorage.getItem('newsId')) {
      localStorage.removeItem('newsId')
    }
  }
}
</script>

<template>
  <div class="management-tab-title-container">
    <text class="management-tab-title">文章管理</text>
    <text class="management-tab-subtitle">为什么我 这么弱？</text>
  </div>
  <NewsList
    v-model="viewType"
    id="news-list-manage"
    @need-scroll="scrollToNews"
    @card-click="onNewsClick"
  />
  <MinecraftButtonClassic class="new-button" @click="onAddNews">新建文章</MinecraftButtonClassic>
  <form
    id="edit-news"
    style="margin-bottom: 100vh"
    class="management-tab-form"
    v-if="status !== 'none' && (userGroup.includes('admin') || userGroup.includes('news_admin'))"
  >
    <text class="management-tab-form-title">{{ status === 'edit' ? '编辑' : '新增' }}文章</text>
    <div class="news-input-item">
      <text class="news-input-label">类型</text>
      <div class="news-button-group">
        <MinecraftButtonClassic
          class="news-button"
          :activated="newsType === 'information'"
          @click="newsType = 'information'"
          >资讯</MinecraftButtonClassic
        >
        <MinecraftButtonClassic
          class="news-button"
          :activated="newsType === 'activity'"
          @click="newsType = 'activity'"
          >活动</MinecraftButtonClassic
        >
        <MinecraftButtonClassic
          class="news-button"
          :activated="newsType === 'notice'"
          @click="newsType = 'notice'"
          >公告</MinecraftButtonClassic
        >
        <MinecraftButtonClassic
          class="news-button"
          :activated="newsType === 'magazine'"
          @click="newsType = 'magazine'"
          >社刊</MinecraftButtonClassic
        >
        <MinecraftButtonClassic
          class="news-button"
          :activated="newsType === 'document'"
          @click="newsType = 'document'"
          >文档</MinecraftButtonClassic
        >
      </div>
    </div>
    <div class="news-input-item">
      <text class="news-input-label">置顶</text>
      <text style="user-select: none; font-size: 0.8rem; color: #ccc"
        >最新的置顶文章会在首页顶部展示！</text
      >
      <MinecraftSwitch v-model="newsPin" />
    </div>
    <div class="news-input-item">
      <text class="news-input-label">文章封面</text>
      <div class="upload-button" v-if="newsImage.trim() === ''" @click="onCoverUpload">
        <PlusIcon />
      </div>
      <picture class="news-image-picture" v-else>
        <img class="news-image" @click="onCoverUpload" :src="newsImage" alt="news-image" />
      </picture>
    </div>
    <div class="news-input-item">
      <text class="news-input-label">ID</text>
      <MinecraftInput v-model="newsId" class="news-input" disabled="true" />
    </div>
    <div class="news-input-item">
      <text class="news-input-label">标题</text>
      <MinecraftInput class="news-input" v-model="newsTitle" placeholder="请输入标题" />
    </div>
    <div class="news-input-item">
      <text class="news-input-label">简介</text>
      <MinecraftTextarea
        v-model="newsBrief"
        class="news-input"
        style="resize: vertical"
        wrap="soft"
        placeholder="简介不宜过长！"
      />
    </div>
    <div class="news-input-item">
      <text class="news-input-label">{{ newsType === 'activity' ? '开始' : '' }}时间</text>
      <Datepicker v-model="newsDate" :format="formatDate" dark :clearable="false" />
    </div>
    <div class="news-input-item" v-if="newsType === 'activity'">
      <text class="news-input-label">结束时间</text>
      <Datepicker v-model="newsEndDate" :format="formatDate" dark :clearable="false" />
    </div>
    <div class="news-input-item">
      <text class="news-input-label">正文</text>
      <div class="news-markdown-edit">
        <div class="news-button-group">
          <MinecraftButtonClassic
            class="news-button"
            :activated="!preview"
            @click="((preview = false), scrollTo('md-editor'))"
            >编辑</MinecraftButtonClassic
          >
          <MinecraftButtonClassic
            class="news-button"
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
          v-model="newsText"
          @on-remount="mountSounds"
          @on-save="saveNews"
          :preview="false"
        >
          <template #defToolbars>
            <NormalToolbar title="添加 PDF 文件" @on-click="addPdfFile">
              <UploadPdf class="md-editor-icon" />
            </NormalToolbar>
            <NormalToolbar title="加载本地存档" @on-click="loadNews">
              <LoadNews class="md-editor-icon" />
            </NormalToolbar>
          </template>
        </MdEditor>
        <div class="news-main-content" v-show="preview">
          <div class="news-main-item-list">
            <div class="news-main-item" v-for="(item, index) in newsContent" :key="index">
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
    <MinecraftButtonClassic @click="commitNews">保存</MinecraftButtonClassic>
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
        >↑点击上传</MinecraftButtonClassic
      >
    </div>
    <template v-slot:footer>
      <span></span>
    </template>
  </MinecraftDialog>
  <MinecraftDialog title="上传封面" v-model="coverUploadVisible">
    <div class="pdf-options-container">
      <text class="pdf-options-label">图片地址</text>
      <div class="pdf-options-input-container">
        <MinecraftInput class="pdf-options-input" v-model="newsImage" placeholder="填入图片链接" />
        <MinecraftButtonClassic class="pdf-options-button" @click="coverUploadVisible = false"
          >保存</MinecraftButtonClassic
        >
      </div>
    </div>
    <div class="pdf-options-container">
      <text class="pdf-options-label">直接上传</text>
      <MinecraftButtonClassic class="pdf-options-button" style="width: 10rem" @click="onSelectImage"
        >↑点击上传</MinecraftButtonClassic
      >
    </div>
    <template v-slot:footer>
      <span></span>
    </template>
  </MinecraftDialog>
</template>

<style lang="css" scoped>
.news-input-item {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.news-input-label {
  user-select: none;
  font-size: 1.2rem;
  color: #fff;
  text-wrap: nowrap;
}

.news-input {
  font-size: 1rem;
  width: 100%;
  min-width: 5rem;
}

.news-button-group {
  display: flex;
  align-items: center;
  user-select: none;
  width: 100%;
}

.new-button {
  font-size: 1.5rem;
}

.news-markdown-edit {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.news-button-group {
  display: flex;
  align-items: center;
}

.news-button {
  font-size: 1.2rem;
  width: 6rem;
}

.news-main-content {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: fit-content;

  background:
    linear-gradient(to right, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.4)),
    radial-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5)), url('/blockbg/dirt.png');
}

.news-main-item-list {
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 1rem 4rem;
  padding-bottom: 2rem;
}

.news-main-item {
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

.news-image {
  height: 6rem;
  width: auto;
  user-select: none;
}

.news-image-picture {
  cursor: pointer;
  height: 6rem;
  width: min-content;
  position: relative;
}

.news-image-picture::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  background-color: rgba(255, 255, 255, 0);
  transition: all 0.2s ease-in-out;
}

.news-image-picture:hover::after {
  background-color: rgba(255, 255, 255, 0.1);
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
