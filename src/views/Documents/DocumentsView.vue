<script setup lang="ts">
import {
  GetAllCategories,
  GetAllTabs,
  GetDocument,
  GetDocuments,
  type DocumentBrief,
  type DocumentEntity,
} from '@/api/documents'
import type { NewsSegment } from '@/api/newslist'
import CalendarIcon from '@/components/icons/CalendarIcon.vue'
import ListIcon from '@/components/icons/ListIcon.vue'
import UserIcon from '@/components/icons/UserIcon.vue'
import MinecraftButton from '@/components/utils/MinecraftButton.vue'
import MinecraftButtonClassic from '@/components/utils/MinecraftButtonClassic.vue'
import { MdPreview } from 'md-editor-v3'
import { onMounted, reactive, ref } from 'vue'

const scrollToIndex = (index: number) => {
  const element = document.getElementById(`pdf-renderer-${index}`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

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

interface Tab {
  tab: string
  isOpen: boolean
  documents: DocumentBrief[]
}

interface Category {
  category: string
  isOpen: boolean
  tabs: Tab[]
}

const articles = ref<Category[]>([])
const activeId = ref('')
const documentContent = reactive<DocumentEntity>({
  id: '',
  title: '',
  description: '',
  category: '',
  tab: '',
  priority: 0,
  content: [] as NewsSegment[],
  contributors: [],
  createTime: '',
  updateTime: '',
})

const openDocument = async (id: string) => {
  activeId.value = id
  const result = await GetDocument(activeId.value)
  if (result) {
    documentContent.id = result.id
    documentContent.title = result.title
    documentContent.description = result.description
    documentContent.category = result.category
    documentContent.tab = result.tab
    documentContent.priority = result.priority
    documentContent.content = result.content
    documentContent.contributors = result.contributors
    documentContent.createTime = result.createTime
    documentContent.updateTime = result.updateTime
  }
}

const sidebarExpand = ref(true)
const menuExpand = ref(false)

const onResize = () => {
  if (window.innerWidth < 768) {
    sidebarExpand.value = false
  } else {
    sidebarExpand.value = true
    menuExpand.value = false
  }
}

onMounted(async () => {
  if (window.innerWidth < 768) {
    sidebarExpand.value = false
  }
  window.addEventListener('resize', onResize)

  const categories = await GetAllCategories()
  for (const category of categories) {
    articles.value.push({ category: category, isOpen: false, tabs: [] })
    const tabs = await GetAllTabs(category)
    for (const tab of tabs) {
      const documents = await GetDocuments(category, tab)
      articles.value[articles.value.length - 1].tabs.push({
        tab: tab,
        isOpen: false,
        documents: documents,
      })
    }
  }
})
</script>

<template>
  <div class="documents-view">
    <div
      class="documents-nav-container"
      :type="menuExpand ? '' : 'shrink'"
      @click="menuExpand = false"
    >
      <nav class="documents-nav" :type="menuExpand ? '' : 'shrink'" @click.stop>
        <div class="category-list" v-for="(category, index) in articles" :key="index">
          <MinecraftButtonClassic
            class="category-button"
            @click="category.isOpen = !category.isOpen"
          >
            {{ category.category }}
          </MinecraftButtonClassic>
          <div
            class="tab-container"
            v-for="(tab, tabIndex) in articles[index].tabs"
            :key="tabIndex"
          >
            <div class="tab-v-if" v-if="category.isOpen">
              <MinecraftButtonClassic class="tab-button" @click="tab.isOpen = !tab.isOpen">
                {{ tab.tab }}
              </MinecraftButtonClassic>
            </div>
            <div class="document-list" v-if="tab.isOpen">
              <MinecraftButtonClassic
                class="document-btn"
                v-for="(document, docIndex) in articles[index].tabs[tabIndex].documents"
                :key="docIndex"
                :activated="activeId === document.id ? 'true' : 'false'"
                @click="openDocument(document.id)"
                >{{ document.title }}</MinecraftButtonClassic
              >
            </div>
          </div>
        </div>
      </nav>
    </div>
    <aside class="documents-aside mc-border" :type="sidebarExpand ? '' : 'shrink'">
      <div class="category-list" v-for="(category, index) in articles" :key="index">
        <MinecraftButtonClassic class="category-button" @click="category.isOpen = !category.isOpen">
          {{ category.category }}
        </MinecraftButtonClassic>
        <div class="tab-container" v-for="(tab, tabIndex) in articles[index].tabs" :key="tabIndex">
          <div class="tab-v-if" v-if="category.isOpen">
            <MinecraftButtonClassic class="tab-button" @click="tab.isOpen = !tab.isOpen">
              {{ tab.tab }}
            </MinecraftButtonClassic>
          </div>
          <div class="document-list" v-if="tab.isOpen">
            <MinecraftButtonClassic
              class="document-btn"
              v-for="(document, docIndex) in articles[index].tabs[tabIndex].documents"
              :key="docIndex"
              :activated="activeId === document.id ? 'true' : 'false'"
              @click="openDocument(document.id)"
              >{{ document.title }}</MinecraftButtonClassic
            >
          </div>
        </div>
      </div>
    </aside>
    <main class="document-main mc-border" :type="sidebarExpand ? '' : 'shrink'">
      <div class="document-main-title">{{ documentContent.title }}</div>
      <div class="document-main-subtitle" v-if="documentContent.title.trim() !== ''">
        <UserIcon class="document-icon" />
        <div v-for="(contributor, index) in documentContent.contributors" :key="contributor">
          {{
            contributor + (index === (documentContent.contributors || []).length - 1 ? '' : ', ')
          }}
        </div>
        <CalendarIcon class="document-icon" />
        <div>
          {{
            (documentContent.updateTime || '').trim() === ''
              ? new Date().toLocaleDateString().replace('/', '-').replace('/', '-')
              : documentContent.updateTime
          }}
        </div>
      </div>
      <div class="document-main-item-list">
        <div
          class="document-main-item"
          v-for="(item, index) in documentContent.content"
          :key="index"
        >
          <MdPreview
            v-if="item.type === 'markdown'"
            theme="dark"
            language="zh-CN"
            preview-theme="minecraft"
            :model-value="item.content"
            @on-remount="mountSounds"
          />
          <MinecraftButton
            v-if="item.type === 'pdf_file'"
            class="pdf-read-btn"
            @click="scrollToIndex(index)"
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
    </main>
    <MinecraftButton
      class="sidebar-expand-btn"
      v-if="sidebarExpand === false"
      @click="menuExpand = !menuExpand"
    >
      <ListIcon />
    </MinecraftButton>
  </div>
</template>

<style lang="css" scoped>
.documents-view {
  width: 100%;
  padding-top: 5rem;
  min-height: 100vh;

  display: flex;
  flex-direction: row;
  position: relative;
}

.documents-aside {
  margin-left: 3rem;
  margin-right: 1rem;
  width: 18rem;
  padding: 15px;
  box-shadow: 0 0 0 3px #000;
  transition: all 0.3s ease-in-out;
  overflow: hidden;
}

.documents-aside[type='shrink'] {
  padding-left: 0;
  padding-right: 0;
  width: 0;
  border: none;
  box-shadow: none;
  margin-right: 0;
  margin-left: 0;
}

.category-list {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.category-button {
  width: 100%;
  margin-bottom: 0.5rem;
}

.tab-container {
  width: 90%;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.tab-button {
  margin-bottom: 0.3rem;
}

.tab-v-if {
  width: 100%;
  margin-bottom: 4px;
}

.document-list {
  width: 90%;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-bottom: 4px;
}

.document-btn {
  margin-bottom: 2px;
}

.document-main {
  width: 100%;
  margin-right: 3rem;
  height: calc(100vh - 5rem);
  overflow-y: scroll;
  transition: all 0.3s ease-in-out;
}

.document-main[type='shrink'] {
  margin-left: 1rem;
  margin-right: 1rem;
}

.document-main-title {
  font-size: 1.6rem;
  color: white;
  padding-left: 3rem;
  padding-top: 1rem;
  margin-bottom: 1rem;
}

.document-main-subtitle {
  display: flex;
  align-items: center;
  padding-left: 2.5rem;
  user-select: none;
  color: rgba(255, 255, 255, 0.6);
}

.document-icon {
  width: 18px;
  height: 18px;
  margin-right: 0.5rem;
  margin-left: 0.5rem;
}

.document-main-item-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 0 3rem;
  padding-bottom: 2rem;
}

.document-main-item {
  width: 100%;
  margin-top: 0.5rem;
}

.pdf-read-btn {
  height: 3rem;
  font-size: 1.2rem;
  margin-top: 2rem;
}

.pdf-renderer {
  width: 100%;
  height: 100vh;
  margin: 2rem 0;
}

.documents-nav-container {
  position: absolute;
  left: 0;
  top: 0;
  background-color: rgba(0, 0, 0, 0.6);
  height: 100vh;
  width: 100vw;
  z-index: 512;
}

.documents-nav-container[type='shrink'] {
  width: 0;
}

.documents-nav {
  position: absolute;
  left: 0;
  top: 5rem;
  height: calc(100vh - 5rem);
  background-color: color-mix(in srgb, white, black 75%);
  width: 18rem;
  padding: 15px;
  border-right: 2px solid rgba(255, 255, 255, 0.6);
  border-top: 2px solid rgba(255, 255, 255, 0.6);
  border-bottom: 2px solid rgba(255, 255, 255, 0.6);
  transition: all 0.3s ease-in-out;
  overflow: hidden;
}

.documents-nav[type='shrink'] {
  width: 0;
  padding: 0;
  border: none;
}

.sidebar-expand-btn {
  position: absolute;
  width: 3rem;
  height: 3rem;
  right: 3rem;
  bottom: 3rem;
  padding: 0.5rem;
}
</style>

<style lang="css">
.category-button .title {
  justify-content: flex-start;
  padding-left: 1rem;
  font-size: 1.3rem;
}

.tab-button .title {
  padding-left: 1rem;
  justify-content: flex-start;
  font-size: 1.2rem;
}

.document-btn .title {
  padding-left: 1rem;
  justify-content: flex-start;
  font-size: 1rem;
}
</style>
