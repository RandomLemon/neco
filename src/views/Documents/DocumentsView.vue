<script setup lang="ts">
import { GetAllCategories, GetAllTabs, GetDocuments, type DocumentBrief } from '@/api/documents'
import MinecraftButtonClassic from '@/components/utils/MinecraftButtonClassic.vue'
import { onMounted, ref } from 'vue'

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

const openDocument = async (id: string) => {
  activeId.value = id
  // TODO: load article
}

onMounted(async () => {
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
    <aside class="documents-aside mc-border">
      <div
        class="category-list"
        v-for="(category, index) in articles"
        :key="index"
      >
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
            <MinecraftButtonClassic
              class="tab-button"
              @click="tab.isOpen = !tab.isOpen"
            >
              {{ tab.tab }}
            </MinecraftButtonClassic>
          </div>
          <div class="document-list" v-if="tab.isOpen">
            <MinecraftButtonClassic
              class="document-button"
              v-for="(document, docIndex) in articles[index].tabs[tabIndex].documents"
              :key="docIndex"
              :activated="activeId === document.id ? 'true' : 'false'"
              @click="openDocument(document.id)"
            >{{ document.title }}</MinecraftButtonClassic>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<style lang="css" scoped>
.documents-view {
  width: 100%;
  padding-top: 5rem;
  min-height: 100vh;

  display: flex;
  flex-direction: row;
}

.documents-aside {
  width: 18rem;
  padding: 15px;
  box-shadow: 0 0 0 3px #000;
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

.document-button {
  margin-bottom: 2px;
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

.document-button .title {
  padding-left: 1rem;
  justify-content: flex-start;
  font-size: 1rem;
}
</style>
