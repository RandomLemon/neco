<script lang="ts" setup>
import {
  CreateNews,
  DeleteFile,
  DeleteNews,
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
import { VueDatePicker } from '@vuepic/vue-datepicker'
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
import PdfViewer from '@/components/PdfViewer.vue'
import { EventBus } from '@/eventbus/EventBus'
import { GetBotDashboardStatus, type BotConnection } from '@/api/bot'

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
  'fullscreen',
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
        newsPdfFiles.value.push(segment.content)
        break
      default:
        toast.error('神秘的正文类型！')
    }
  }
  newsText.value = result
}

const checkContent = async () => {
  let toRemove = []
  for (const key of newsPdfFiles.value) {
    if (!newsText.value.includes(key)) {
      toRemove.push(key)
      const result = await DeleteFile(newsId.value, key)
      if (!result) {
        toast.warning(`已从服务器移除文件：${key}！`)
      } else {
        toast.error(`无法从服务器移除文件：${key}！`)
      }
    }
  }
  for (const key of toRemove) {
    newsPdfFiles.value = newsPdfFiles.value.filter((item) => item !== key)
  }

  toRemove = []
  for (const key of newsImgFiles.value) {
    if (!newsText.value.includes(key)) {
      toRemove.push(key)
      const result = await DeleteFile(newsId.value, key)
      if (!result) {
        toast.warning(`已从服务器移除文件：${key}！`)
      } else {
        toast.error(`无法从服务器移除文件：${key}！`)
      }
    }
  }
  for (const key of toRemove) {
    newsImgFiles.value = newsImgFiles.value.filter((item) => item !== key)
  }
}

const toContent = () => {
  const curText = newsText.value
  const result: NewsSegment[] = []

  if (newsPdfFiles.value.length === 0) {
    if (curText.trim() !== '') {
      result.push({ type: 'markdown', content: curText })
    }
    newsContent.value = result
    return
  }

  const pdfKeysEscaped = newsPdfFiles.value.map((key) =>
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

  newsContent.value = result
}

const router = useRouter()
const toast = useToast()

const viewType = ref<NewsTarget>('information')

const userGroup = ref(JSON.parse(localStorage.getItem('userGroup') || '[]'))

const scrollTo = (id: string) => {
  setTimeout(() => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }, 100)
}

const scrollToNews = () => {
  scrollTo('news-list-manage')
}

const status = ref<'add' | 'edit' | 'none'>('none')

const onNewsClick = async (id: string) => {
  if (userGroup.value.includes('admin') || userGroup.value.includes('news_admin')) {
    // Edit
    status.value = 'edit'
    scrollTo('edit-news')
    newsId.value = id
    const result = await GetNewsDetail(id)
    if (result) {
      newsTitle.value = result.entity.title
      newsBrief.value = result.entity.brief
      newsImage.value = result.entity.image
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
const newsPdfFiles = ref<Array<string>>([])
const newsImgFiles = ref<Array<string>>([])
const newsPin = ref(false)
const newsImage = ref('')
const newsType = ref<NewsTarget>('information')
const newsDate = ref(formatDate(new Date()))
const newsEndDate = ref<string | undefined>(nextYear(new Date()))

const preview = ref(false)
const deleteNewsDialogVisible = ref(false)

const notifyDialogVisible = ref(false)
const notifyConnections = ref<BotConnection[]>([])
const selectedNotifySessionIds = ref<string[]>([])
const isLoadingNotifyConnections = ref(false)
const pendingCommit = ref(false)

const coverUploadVisible = ref(false)

const onCoverUpload = async () => {
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
        newsImage.value = result
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
  newsPdfFiles.value = []
  newsImgFiles.value = []
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
        newsPdfFiles.value.push(result)
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
  newsPdfFiles.value.push(pdfSrc.value)
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
  downloadLink.setAttribute('download', 'save.nmo_new')

  downloadLink.click()
}

const loadNews = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.nmo_new'
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

const cancelEditNews = () => {
  status.value = 'none'
  newsTitle.value = ''
  newsBrief.value = ''
  newsContent.value = []
  newsImage.value = ''
  newsText.value = ''
  newsPdfFiles.value = []
  newsImgFiles.value = []
  newsPin.value = false
  newsType.value = 'information'
  newsDate.value = formatDate(new Date())
  newsEndDate.value = nextYear(new Date())
}

const openDeleteNewsDialog = () => {
  if (newsId.value.trim() === '') {
    toast.warning('请选择文章！')
    return
  }

  deleteNewsDialogVisible.value = true
}

const deleteNews = async () => {
  if (newsId.value.trim() === '') {
    toast.warning('请选择文章！')
    return
  }
  const result = await DeleteNews(newsId.value)
  if (result) {
    toast.error('删除文章失败！')
  } else {
    toast.success('删除文章成功！')
    deleteNewsDialogVisible.value = false
    cancelEditNews()
    EventBus.emit('NewsManagement::refresh')
  }
}

const validateNewsBeforeCommit = () => {
  if (newsTitle.value.trim() === '') {
    toast.warning('请输入标题！')
    return false
  }

  if (newsBrief.value.trim() === '') {
    toast.warning('请输入简介！')
    return false
  }

  if (newsImage.value.trim() === '') {
    toast.warning('请上传封面！')
    return false
  }

  if (newsText.value.length === 0) {
    toast.warning('请输入正文内容！')
    return false
  }

  if (newsDate.value.trim() === '') {
    toast.warning('请输入开始时间！')
    return false
  }

  if (newsType.value.trim() === '') {
    toast.warning('请选择类型！')
    return false
  }

  return true
}

const loadNotifyConnections = async () => {
  isLoadingNotifyConnections.value = true

  const result = await GetBotDashboardStatus()

  isLoadingNotifyConnections.value = false

  if (!result) {
    notifyConnections.value = []
    selectedNotifySessionIds.value = []
    toast.warning('无法获取 WebSocket 连接状态，将只能选择不推送。')
    return
  }

  notifyConnections.value = result.connections || []
  selectedNotifySessionIds.value = notifyConnections.value.map(
    (connection) => connection.session_id,
  )
}

const openNotifyDialog = async () => {
  if (!validateNewsBeforeCommit()) {
    return
  }

  toContent()
  await loadNotifyConnections()
  notifyDialogVisible.value = true
}

const isNotifyConnectionSelected = (sessionId: string) => {
  return selectedNotifySessionIds.value.includes(sessionId)
}

const toggleNotifyConnection = (sessionId: string) => {
  if (isNotifyConnectionSelected(sessionId)) {
    selectedNotifySessionIds.value = selectedNotifySessionIds.value.filter((id) => id !== sessionId)
  } else {
    selectedNotifySessionIds.value.push(sessionId)
  }
}

const selectAllNotifyConnections = () => {
  selectedNotifySessionIds.value = notifyConnections.value.map(
    (connection) => connection.session_id,
  )
}

const clearNotifyConnections = () => {
  selectedNotifySessionIds.value = []
}

const commitNews = async (doesNotify = false, notifySessionIds: string[] = []) => {
  if (!validateNewsBeforeCommit()) {
    return
  }

  toContent()
  pendingCommit.value = true

  const result = await UpdateNews(
    newsId.value,
    newsType.value,
    {
      title: newsTitle.value,
      pin: newsPin.value,
      brief: newsBrief.value,
      date: newsDate.value,
      endDate: newsType.value === 'activity' ? newsEndDate.value : undefined,
      image: newsImage.value,
    },
    newsContent.value,
    doesNotify,
    notifySessionIds,
  )

  pendingCommit.value = false

  if (result) {
    toast.error(`上传文章失败：${result}`)
  } else {
    if (doesNotify) {
      toast.success(`上传文章成功，已推送到 ${notifySessionIds.length} 个 WebSocket 连接！`)
    } else {
      toast.success('上传文章成功，未推送更新消息。')
    }

    EventBus.emit('NewsManagement::refresh')

    if (newsId.value === localStorage.getItem('newsId')) {
      localStorage.removeItem('newsId')
    }
  }
}

const commitNewsWithoutNotify = async () => {
  notifyDialogVisible.value = false
  await commitNews(false, [])
}

const commitNewsWithNotify = async () => {
  if (notifyConnections.value.length === 0) {
    toast.warning('当前没有可推送的 WebSocket 连接。')
    return
  }

  if (selectedNotifySessionIds.value.length === 0) {
    toast.warning('请至少选择一个 WebSocket 连接，或选择“不推送”。')
    return
  }

  notifyDialogVisible.value = false
  await commitNews(true, selectedNotifySessionIds.value)
}

const onUploadImg = async (
  files: Array<File>,
  callback: (urls: string[] | { url: string; alt: string; title: string }[]) => void,
) => {
  const res = await Promise.all(
    files.map(async (file) => {
      const result = await UploadFile(newsId.value, file)
      if (result) {
        newsImgFiles.value.push(result)
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
</script>

<template>
  <div class="management-tab-title-container">
    <h1 class="management-tab-title">文章管理</h1>
    <span class="management-tab-subtitle">
      {{
        userGroup.includes('admin') || userGroup.includes('news_admin')
          ? '今天 NMO 💊 了吗？'
          : '为什么我 这么弱？'
      }}
    </span>
  </div>
  <section class="management-section" aria-labelledby="news-list-title">
    <div class="management-section-header">
      <div class="management-section-title-block">
        <h2 id="news-list-title" class="management-section-title">文章列表</h2>
        <p class="management-section-desc">
          点击文章进行编辑；没有权限的用户会在新窗口打开文章详情。
        </p>
      </div>

      <div
        class="management-toolbar"
        v-if="userGroup.includes('admin') || userGroup.includes('news_admin')"
      >
        <MinecraftButtonClassic class="news-toolbar-button" @click="onAddNews">
          新建文章
        </MinecraftButtonClassic>
      </div>
    </div>

    <NewsList
      style="margin: 0; width: 100%"
      v-model="viewType"
      id="news-list-manage"
      @need-scroll="scrollToNews"
      @card-click="onNewsClick"
      :allow-activity="true"
    />
  </section>
  <form
    id="edit-news"
    class="management-section news-edit-section"
    v-if="status !== 'none' && (userGroup.includes('admin') || userGroup.includes('news_admin'))"
    @submit.prevent="openNotifyDialog"
  >
    <div class="management-section-header">
      <div class="management-section-title-block">
        <h2 class="management-section-title">{{ status === 'edit' ? '编辑' : '新增' }}文章</h2>
        <p class="management-section-desc">
          先编辑基础信息和正文，点击保存后再选择是否推送到机器人连接。
        </p>
      </div>
    </div>
    <section class="management-card" aria-labelledby="news-basic-title">
      <h3 id="news-basic-title" class="management-card-title">基础信息</h3>

      <div class="news-basic-grid">
        <div class="news-input-item" role="group" aria-labelledby="news-type-label">
          <span id="news-type-label" class="news-input-label">类型</span>
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
          </div>
        </div>
        <div class="news-input-item">
          <label class="news-input-label" for="news-pin-switch"> 置顶 </label>

          <span style="user-select: none; font-size: 0.8rem; color: #ccc">
            最新的置顶文章会在首页顶部展示！
          </span>

          <MinecraftSwitch id="news-pin-switch" v-model="newsPin" />
        </div>
        <div class="news-input-item">
          <span class="news-input-label">文章封面</span>
          <button
            v-if="newsImage.trim() === ''"
            type="button"
            class="upload-button"
            aria-label="上传文章封面"
            @click="onCoverUpload"
          >
            <PlusIcon aria-hidden="true" />
          </button>

          <button
            v-else
            type="button"
            class="news-image-picture"
            aria-label="更换文章封面"
            @click="onCoverUpload"
          >
            <img class="news-image" :src="newsImage" alt="" />
          </button>
        </div>
        <div class="news-input-item">
          <label class="news-input-label" for="news-id-input"> ID </label>

          <MinecraftInput id="news-id-input" v-model="newsId" class="news-input" disabled />
        </div>
        <div class="news-input-item">
          <label class="news-input-label" for="news-title-input"> 标题 </label>

          <MinecraftInput
            id="news-title-input"
            class="news-input"
            v-model="newsTitle"
            placeholder="请输入标题"
          />
        </div>
        <div class="news-input-item">
          <label class="news-input-label" for="news-brief-input"> 简介 </label>

          <MinecraftTextarea
            id="news-brief-input"
            v-model="newsBrief"
            class="news-input"
            style="resize: vertical"
            wrap="soft"
            placeholder="简介不宜过长！"
          />
        </div>
        <div class="news-input-item">
          <span id="news-date-label" class="news-input-label">
            {{ newsType === 'activity' ? '开始' : '' }}时间
          </span>
          <VueDatePicker
            aria-labelledby="news-date-label"
            v-model="newsDate"
            :formats="{
              input: formatDate,
            }"
            :time-config="{
              enableTimePicker: false,
            }"
            dark
            :clearable="false"
            auto-apply
          />
        </div>
        <div class="news-input-item" v-if="newsType === 'activity'">
          <span id="news-end-date-label" class="news-input-label"> 结束时间 </span>
          <VueDatePicker
            aria-labelledby="news-end-date-label"
            v-model="newsEndDate"
            :formats="{
              input: formatDate,
            }"
            :time-config="{
              enableTimePicker: false,
            }"
            dark
            :clearable="false"
            auto-apply
          />
        </div>
      </div>
    </section>
    <section class="management-card" aria-labelledby="news-content-card-title">
      <h3 id="news-content-card-title" class="management-card-title">正文内容</h3>

      <div class="news-input-item">
        <div class="news-markdown-edit" aria-labelledby="news-content-label">
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
            @on-upload-img="onUploadImg"
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
                <PdfViewer
                  :id="`pdf-renderer-${index}`"
                  v-if="item.type === 'pdf_file'"
                  class="pdf-renderer mc-border"
                  :pdf-url="item.content"
                  :title="`${newsTitle || '文章'} PDF 预览`"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <div class="management-action-row">
      <MinecraftButtonClassic class="news-action-button" @click="cancelEditNews">
        取消编辑
      </MinecraftButtonClassic>

      <MinecraftButtonClassic class="news-action-button" @click="openDeleteNewsDialog">
        删除文章
      </MinecraftButtonClassic>

      <MinecraftButtonClassic class="news-action-button" native-type="submit">
        保存文章
      </MinecraftButtonClassic>
    </div>
  </form>
  <MinecraftDialog title="添加 PDF 文件" v-model="showPdfDialog">
    <div class="pdf-options-container">
      <label class="pdf-options-label" for="news-pdf-url"> 文件地址 </label>

      <div class="pdf-options-input-container">
        <MinecraftInput
          id="news-pdf-url"
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
      <span class="pdf-options-label">直接上传</span>
      <MinecraftButtonClassic class="pdf-options-button" style="width: 10rem" @click="onSelectPdf">
        ↑ 点击上传
      </MinecraftButtonClassic>
    </div>
    <template v-slot:footer>
      <span></span>
    </template>
  </MinecraftDialog>
  <MinecraftDialog title="上传封面" v-model="coverUploadVisible">
    <div class="pdf-options-container">
      <label class="pdf-options-label" for="news-cover-url"> 图片地址 </label>

      <div class="pdf-options-input-container">
        <MinecraftInput
          id="news-cover-url"
          class="pdf-options-input"
          v-model="newsImage"
          placeholder="填入图片链接"
        />

        <MinecraftButtonClassic class="pdf-options-button" @click="coverUploadVisible = false">
          保存
        </MinecraftButtonClassic>
      </div>
    </div>
    <div class="pdf-options-container">
      <span class="pdf-options-label">直接上传</span>
      <MinecraftButtonClassic
        class="pdf-options-button"
        style="width: 10rem"
        @click="onSelectImage"
      >
        ↑ 点击上传
      </MinecraftButtonClassic>
    </div>
    <template v-slot:footer>
      <span></span>
    </template>
  </MinecraftDialog>
  <MinecraftDialog title="删除文章" v-model="deleteNewsDialogVisible" @confirm="deleteNews">
    <p>
      确定要删除
      <strong>{{ newsTitle || newsId || '这篇文章' }}</strong>
      吗？
    </p>
    <p class="management-danger-text">删除后文章列将会永远消失！（真的很久！）</p>
  </MinecraftDialog>
  <MinecraftDialog
    title="保存文章"
    v-model="notifyDialogVisible"
    cancelText="不推送"
    confirmText="保存并推送"
    @confirm="commitNewsWithNotify"
  >
    <div class="notify-options-container" aria-labelledby="notify-dialog-desc">
      <p id="notify-dialog-desc" class="notify-options-desc">
        文章将会先保存。你可以选择是否把本次更新推送到当前在线的 WebSocket 机器人连接。
      </p>

      <div class="notify-summary-card" role="status" aria-live="polite">
        <span>当前在线连接：</span>
        <strong>{{ notifyConnections.length }}</strong>
        <span>已选择：</span>
        <strong>{{ selectedNotifySessionIds.length }}</strong>
      </div>

      <div class="notify-button-row" v-if="notifyConnections.length > 0">
        <MinecraftButtonClassic class="notify-action-button" @click="selectAllNotifyConnections">
          全选
        </MinecraftButtonClassic>

        <MinecraftButtonClassic class="notify-action-button" @click="clearNotifyConnections">
          全不选
        </MinecraftButtonClassic>
      </div>

      <p v-if="isLoadingNotifyConnections" class="notify-options-desc">
        正在读取 WebSocket 连接状态……
      </p>

      <p v-else-if="notifyConnections.length === 0" class="notify-warning-text">
        当前没有在线 WebSocket 连接。你仍然可以保存文章，但不会推送更新消息。
      </p>

      <div v-else class="notify-connection-list" role="list" aria-label="可推送的 WebSocket 连接">
        <button
          v-for="connection in notifyConnections"
          :key="connection.session_id"
          type="button"
          class="notify-connection-item"
          :class="{ selected: isNotifyConnectionSelected(connection.session_id) }"
          :aria-pressed="isNotifyConnectionSelected(connection.session_id)"
          @click="toggleNotifyConnection(connection.session_id)"
        >
          <span class="notify-connection-main">
            <strong>{{ connection.identifier || '未命名机器人' }}</strong>
            <span>{{ connection.token_name }}</span>
          </span>

          <span class="notify-connection-sub">
            <span>会话：{{ connection.session_id.slice(0, 8) }}...</span>
            <span>连接时间：{{ connection.connected }}</span>
          </span>

          <span class="notify-connection-check" aria-hidden="true">
            {{ isNotifyConnectionSelected(connection.session_id) ? '✓ 已选择' : '○ 未选择' }}
          </span>
        </button>
      </div>

      <p class="notify-warning-text">
        如果选择“不推送”，文章只会保存，不会向任何机器人发送更新通知。
      </p>
    </div>

    <template v-slot:footer>
      <div class="notify-dialog-footer">
        <MinecraftButtonClassic class="notify-footer-button" @click="commitNewsWithoutNotify">
          不推送
        </MinecraftButtonClassic>

        <MinecraftButtonClassic class="notify-footer-button" @click="notifyDialogVisible = false">
          取消
        </MinecraftButtonClassic>

        <MinecraftButtonClassic
          class="notify-footer-button"
          :disabled="pendingCommit || notifyConnections.length === 0"
          @click="commitNewsWithNotify"
        >
          保存并推送
        </MinecraftButtonClassic>
      </div>
    </template>
  </MinecraftDialog>
</template>

<style lang="css" scoped>
.notify-options-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.notify-options-desc {
  margin: 0;
  color: rgba(255, 255, 255, 0.82);
}

.notify-summary-card {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.75rem;
  color: #fff;
  background-color: #2e2e2e;
  border: 2px solid #1a1a1a;
  box-shadow:
    inset -2px -2px 0 0 #1f1f1f,
    inset 2px 2px 0 0 #454545;
}

.notify-button-row {
  display: flex;
  gap: 1rem;
}

.notify-action-button {
  width: 6rem;
}

.notify-connection-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 18rem;
  overflow-y: auto;
  padding: 0.5rem;
  background-color: #202020;
  border: 2px solid #111;
}

.notify-connection-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: left;
  padding: 0.75rem;
  color: #eee;
  background-color: #303030;
  border: 2px solid #111;
  cursor: pointer;
  font: inherit;
}

.notify-connection-item:hover,
.notify-connection-item.selected {
  background-color: rgba(100, 100, 255, 0.25);
}

.notify-connection-item:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 3px;
}

.notify-connection-main,
.notify-connection-sub {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.notify-connection-main strong {
  color: #fff;
}

.notify-connection-sub {
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.9rem;
}

.notify-connection-check {
  color: #c6f6b6;
}

.notify-warning-text {
  margin: 0;
  color: #f0c36a;
}

.notify-dialog-footer {
  flex: 0 0 auto;
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--minecraft-gray-light);
}

.notify-footer-button {
  width: 8rem;
  font-size: 1.1rem;
}

@media screen and (max-width: 768px) {
  .notify-button-row,
  .notify-dialog-footer {
    flex-direction: column;
  }

  .notify-action-button,
  .notify-footer-button {
    width: 100%;
  }
}

.upload-button,
.news-image-picture {
  border: 0;
  padding: 0;
  background: transparent;
  color: inherit;
  font: inherit;
}

.upload-button:focus-visible,
.news-image-picture:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 4px;
}

.news-input {
  font-size: 1rem;
  width: 100%;
  min-width: 5rem;
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
    linear-gradient(to right, rgba(0, 0, 0, 0.72), rgba(0, 0, 0, 0.42), rgba(0, 0, 0, 0.72)),
    radial-gradient(circle at 50% 18%, rgba(108, 195, 73, 0.16), transparent 28rem),
    url('/background/bg.jpg');
  background-size: auto, auto, 468px;
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

.operation-btn-group {
  display: flex;
  gap: 1rem;
}

.news-toolbar-button {
  width: 8rem;
}

.news-edit-section {
  margin-bottom: 100vh;
}

.news-basic-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: 1rem;
}

.news-basic-grid .news-input-item {
  min-width: 0;
}

.news-input-item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.news-input-label {
  user-select: none;
  font-size: 1rem;
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
  flex-wrap: wrap;
  gap: 0.5rem;
  user-select: none;
  width: 100%;
}

.news-button {
  font-size: 1.1rem;
  width: 6rem;
}

.news-action-button {
  width: 8rem;
}

@media screen and (max-width: 768px) {
  .news-toolbar-button,
  .news-action-button {
    width: 100%;
  }
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
