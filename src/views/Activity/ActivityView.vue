<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue'
import ActivityItem from './ActivityItem.vue'
import { GetNews, GetNewsTotal, type NewsEntity } from '@/api/newslist'
import MinecraftButton from '@/components/utils/MinecraftButton.vue'
import MinecraftInput from '@/components/utils/MinecraftInput.vue'

const activityTotal = ref<number>(0)
const activities = ref<NewsEntity[]>([])
const page = ref<number>(1)
const pageSize = ref<number>(20)
const maxPage = computed(() => {
  return Math.ceil(activityTotal.value / pageSize.value)
})
const pageInput = ref('1')
const activityLoading = ref(false)

const scrollToTitle = () => {
  const newsList = document.getElementById('activity-title')
  if (newsList) {
    const targetPosition = newsList.offsetTop - 16
    requestAnimationFrame(() => {
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth',
      })
    })
  }
}

const refreshNews = () => {
  activityLoading.value = true
  scrollToTitle()
  setTimeout(async () => {
    activities.value = await GetNews('activity', page.value, pageSize.value)
    activityLoading.value = false
  }, 1000)
}

const movePage = (dir: 'prev' | 'next') => {
  if (dir === 'prev') {
    if (page.value > 1) {
      page.value--
      refreshNews()
    }
  } else {
    if (page.value < maxPage.value) {
      page.value++
      refreshNews()
    }
  }
}

const setPage = () => {
  if (!Number.isNaN(pageInput.value)) {
    const number = Number(pageInput.value)
    if (number > 0 && number <= maxPage.value && number !== page.value) {
      page.value = number
      refreshNews()
    }
  }
}

onMounted(async () => {
  activityTotal.value = await GetNewsTotal('activity')
  activityLoading.value = true
  activities.value = await GetNews('activity', page.value, pageSize.value)
  activityLoading.value = false
})
</script>

<template>
  <div class="activity-area">
    <p id="activity-title">活动</p>
    <div
      class="activity-list-loading-container"
      v-if="activityLoading"
      role="status"
      aria-live="polite"
    >
      <img class="activity-list-loading" src="/loading.gif" alt="" />
      <span class="sr-only">正在加载活动列表</span>
    </div>
    <div class="activity-list" v-else>
      <ActivityItem
        class="activity-item"
        v-for="activity in activities"
        :key="activity.id"
        :activity="activity"
        :style="{
          '--delay': activities.indexOf(activity) * 0.1 + 's',
        }"
      />
    </div>
    <div class="activity-pagination" v-if="!activityLoading">
      <div class="activity-pagination-item">
        <MinecraftButton class="activity-pagination-button" @click="movePage('prev')">{{
          '<'
        }}</MinecraftButton>
        <span class="activity-pagination-text">第</span>
        <span class="activity-pagination-text special page">{{ page }}</span>
        <span class="activity-pagination-text">/</span>
        <span class="activity-pagination-text special total">{{ maxPage }}</span>
        <span class="activity-pagination-text">页</span>
        <MinecraftButton class="activity-pagination-button" @click="movePage('next')">{{
          '>'
        }}</MinecraftButton>
      </div>
      <div class="activity-pagination-item">
        <span class="activity-pagination-text">前往</span>
        <MinecraftInput class="activity-pagination-input" v-model="pageInput" />
        <span class="activity-pagination-text">页</span>
        <MinecraftButton class="activity-pagination-button" @click="setPage">→</MinecraftButton>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
.activity-area {
  min-height: 100vh;
  padding-top: 5rem;
  display: flex;
  flex-direction: column;
  background-color: #303030;
  background-image: url('/background/header-bg.jpg'), url('/background/bg.jpg');
  background-repeat: repeat-x, repeat;
  background-position:
    top left,
    top left;
  background-size:
    auto 234px,
    468px;
}

.activity-area p {
  user-select: none;
  color: #fff;
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
  margin: 0;
}

.activity-item {
  opacity: 0;
  animation: fade-in 0.5s ease-in-out forwards;
  animation-delay: var(--delay);
}

.activity-list-loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 40rem;
}

.activity-list-loading {
  user-select: none;
  width: 16rem;
  height: 16rem;
}

.activity-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 1rem;
  margin: 1.5rem;
  gap: 1.5rem;
}

.post-list {
  margin: 1rem;
}

.activity-pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-bottom: 2rem;
}

.activity-pagination-item {
  display: inline-flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: center;
  height: 2rem;
  margin-top: 1rem;
}

.activity-pagination-button {
  font-size: 1.5rem;
  height: 2rem;
  width: 2rem;
}

.activity-pagination-text {
  user-select: none;
  font-size: 1.5rem;
  margin: 0 0.5rem;
}

.activity-pagination-text.special {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  height: 2rem;
  padding: 4px;
  margin: 0;
  font-size: 1rem;
}

.activity-pagination-text.page {
  border: 1px solid #a0e081;
}

.activity-pagination-text.total {
  border: 1px solid white;
}

.activity-pagination-input {
  height: 2rem;
  width: 3rem;
  font-size: 1rem;
  text-align: center;
}
</style>
