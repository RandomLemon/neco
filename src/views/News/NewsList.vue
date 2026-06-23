<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, watch, computed, nextTick } from 'vue'
import { GetNews, GetNewsTotal } from '@/api/newslist'
import type { NewsEntity, NewsTarget } from '@/api/newslist'
import NewsItem from './NewsItem.vue'
import MinecraftButton from '@/components/utils/MinecraftButton.vue'
import MinecraftInput from '@/components/utils/MinecraftInput.vue'
import { EventBus } from '@/eventbus/EventBus'

const emit = defineEmits(['need-scroll', 'card-click'])

EventBus.on('NewsManagement::refresh', async () => {
  newsLoading.value = true
  emit('need-scroll')
  setTimeout(async () => {
    newsTotal.value = await GetNewsTotal(model.value as NewsTarget)
    news.value = await GetNews(model.value as NewsTarget, page.value, pageSize.value)
    newsLoading.value = false
  }, 500)
})

const model = defineModel({
  type: String as () => NewsTarget,
  default: 'information',
})

const props = defineProps({
  allowActivity: {
    type: Boolean,
    default: false,
  },
})

const newsTotal = ref<number>(0)
const news = ref<NewsEntity[]>([])
const page = ref<number>(1)
const pageSize = ref<number>(60)
const maxPage = computed(() => {
  return Math.ceil(newsTotal.value / pageSize.value)
})
const pageInput = ref('1')
const newsLoading = ref(false)

const refreshNews = () => {
  newsLoading.value = true
  emit('need-scroll')
  setTimeout(async () => {
    newsTotal.value = await GetNewsTotal(model.value as NewsTarget)
    news.value = await GetNews(model.value as NewsTarget, page.value, pageSize.value)
    newsLoading.value = false
  }, 500)
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
  const inputPage = Number(pageInput.value)

  if (!Number.isInteger(inputPage)) {
    pageInput.value = `${page.value}`
    return
  }

  const originPage = page.value

  if (inputPage < 1) {
    page.value = 1
  } else if (inputPage > maxPage.value) {
    page.value = maxPage.value
  } else {
    page.value = inputPage
  }

  pageInput.value = `${page.value}`
  if (originPage !== page.value) {
    refreshNews()
  }
}

const onPageInput = () => {
  pageInput.value = pageInput.value.replace(/[^\d]/g, '')
}

watch(
  () => model.value,
  (newVal, oldVal) => {
    if (newVal === oldVal) {
      return
    }
    page.value = 1
    refreshNews()
  },
)

const optionFocus = ref(false)

const newsTypeOptions = computed(() => {
  const options: { label: string; value: NewsTarget }[] = [
    { label: '最新资讯', value: 'information' },
    { label: '最新社刊', value: 'magazine' },
    { label: '最新公告', value: 'notice' },
  ]

  if (props.allowActivity) {
    options.push({ label: '最新活动', value: 'activity' })
  }

  return options
})

const currentNewsTypeLabel = computed(() => {
  return newsTypeOptions.value.find((item) => item.value === model.value)?.label ?? '最新资讯'
})

const newsTypeButtonRef = ref<HTMLButtonElement | null>(null)
const newsTypeOptionRefs = ref<HTMLButtonElement[]>([])

const toggleNewsTypeOptions = async () => {
  optionFocus.value = !optionFocus.value

  if (optionFocus.value) {
    await nextTick()

    const activeIndex = newsTypeOptions.value.findIndex((item) => item.value === model.value)
    newsTypeOptionRefs.value[Math.max(activeIndex, 0)]?.focus()
  }
}

const openNewsTypeOptions = async () => {
  optionFocus.value = true

  await nextTick()

  const activeIndex = newsTypeOptions.value.findIndex((item) => item.value === model.value)
  newsTypeOptionRefs.value[Math.max(activeIndex, 0)]?.focus()
}

const closeNewsTypeOptions = () => {
  optionFocus.value = false
  newsTypeButtonRef.value?.focus()
}

const selectNewsType = (value: NewsTarget) => {
  model.value = value
  optionFocus.value = false
  newsTypeButtonRef.value?.focus()
}

const focusNewsTypeOption = (index: number) => {
  const optionCount = newsTypeOptions.value.length

  if (optionCount <= 0) {
    return
  }

  const nextIndex = (index + optionCount) % optionCount
  newsTypeOptionRefs.value[nextIndex]?.focus()
}

const newsTypeDropdownRef = ref<HTMLElement | null>(null)

const onDocumentClick = (event: MouseEvent) => {
  if (!newsTypeDropdownRef.value) {
    return
  }

  if (!newsTypeDropdownRef.value.contains(event.target as Node)) {
    optionFocus.value = false
  }
}

onMounted(async () => {
  document.addEventListener('click', onDocumentClick)

  newsTotal.value = await GetNewsTotal(model.value as NewsTarget)
  newsLoading.value = true
  news.value = await GetNews(model.value as NewsTarget, page.value, pageSize.value)
  newsLoading.value = false
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
})
</script>

<template>
  <div class="news-list-panel mc-border">
    <div class="news-title-container">
      <div class="news-title-item">
        <div class="news-title-dropdown" ref="newsTypeDropdownRef">
          <button
            ref="newsTypeButtonRef"
            type="button"
            :value="model"
            class="news-title"
            :stat="optionFocus ? 'active' : 'inactive'"
            aria-haspopup="listbox"
            :aria-expanded="optionFocus"
            aria-controls="news-type-options"
            @click.stop="toggleNewsTypeOptions"
            @keydown.down.prevent="openNewsTypeOptions"
            @keydown.enter.prevent="toggleNewsTypeOptions"
            @keydown.space.prevent="toggleNewsTypeOptions"
            @keydown.esc.stop.prevent="closeNewsTypeOptions"
          >
            {{ currentNewsTypeLabel }}
          </button>

          <div
            id="news-type-options"
            class="news-title-options"
            v-if="optionFocus"
            role="listbox"
            aria-label="新闻分类"
            :aria-activedescendant="`news-type-option-${model}`"
            @keydown.esc.stop.prevent="closeNewsTypeOptions"
          >
            <button
              v-for="(option, index) in newsTypeOptions"
              :id="`news-type-option-${option.value}`"
              :key="option.value"
              ref="newsTypeOptionRefs"
              type="button"
              role="option"
              :aria-selected="model === option.value"
              :stat="model === option.value ? 'active' : 'inactive'"
              class="news-title-option"
              @click="selectNewsType(option.value)"
              @keydown.enter.prevent="selectNewsType(option.value)"
              @keydown.space.prevent="selectNewsType(option.value)"
              @keydown.down.prevent="focusNewsTypeOption(index + 1)"
              @keydown.up.prevent="focusNewsTypeOption(index - 1)"
              @keydown.home.prevent="focusNewsTypeOption(0)"
              @keydown.end.prevent="focusNewsTypeOption(newsTypeOptions.length - 1)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
        <span class="news-total">
          {{ newsTotal.toLocaleString() }}
        </span>
      </div>
      <div class="news-title-item sort-by">
        <span class="news-sort-by"> 排序方式： </span>
        <span class="news-sort-by-option"> 最新发布 </span>
      </div>
    </div>
    <div class="news-list-loading-container" v-if="newsLoading" role="status" aria-live="polite">
      <img class="news-list-loading" src="/loading.gif" alt="" />
      <span class="sr-only">正在加载新闻列表</span>
    </div>
    <div class="news-list-container" v-else>
      <NewsItem
        class="news-list-item"
        v-for="item in news"
        :key="item.id"
        :news="item"
        :style="{
          '--delay': news.indexOf(item) * 0.1 + 's',
        }"
        @card-click="emit('card-click', item.id)"
      />
    </div>
    <div class="news-pagination" v-if="!newsLoading">
      <div class="news-pagination-item">
        <MinecraftButton
          class="news-pagination-button"
          aria-label="上一页"
          :disabled="page <= 1"
          @click="movePage('prev')"
        >
          ‹
        </MinecraftButton>
        <span class="news-pagination-text">第</span>
        <span class="news-pagination-text special page">{{ page }}</span>
        <span class="news-pagination-text">/</span>
        <span class="news-pagination-text special total">{{ maxPage }}</span>
        <span class="news-pagination-text">页</span>
        <MinecraftButton
          class="news-pagination-button"
          aria-label="下一页"
          :disabled="page >= maxPage"
          @click="movePage('next')"
        >
          ›
        </MinecraftButton>
      </div>
      <div class="news-pagination-item">
        <label class="news-pagination-text" for="news-page-input">前往</label>
        <MinecraftInput
          id="news-page-input"
          class="news-pagination-input"
          v-model="pageInput"
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          autocomplete="off"
          :aria-describedby="'news-page-help'"
          @keyup.enter="setPage"
          @input="onPageInput"
        />

        <span id="news-page-help" class="sr-only"> 请输入 1 到 {{ maxPage }} 之间的页码 </span>
        <span class="news-pagination-text">页</span>
        <MinecraftButton
          class="news-pagination-button"
          aria-label="跳转到输入的页码"
          @click="setPage"
        >
          →
        </MinecraftButton>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
.news-list-panel {
  width: calc(100% - 4rem);
  margin: 2rem;
  background:
    linear-gradient(to right, rgba(24, 24, 24, 0.4), rgba(24, 24, 24, 0.2), rgba(24, 24, 24, 0.4)),
    radial-gradient(rgba(24, 24, 24, 0.2), rgba(24, 24, 24, 0.8)), url('/blockbg/cobblestone.png');
  background-size:
    auto,
    auto,
    32px 32px;
  padding: 1.5rem;
}

.news-title-container {
  display: flex;
  align-items: center;
  width: 100%;
  flex-wrap: wrap;
}

.news-title-dropdown {
  position: relative;
  display: flex;
  align-items: center;
}

.news-title {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1rem;
  width: 10.5rem;
  height: 3.5rem;
  user-select: none;
  font-size: 1.5rem;
  background-color: transparent;
  cursor: pointer;
  border: none;
  border-radius: 0;
}

.news-title:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.news-title:focus {
  outline: 1px solid var(--minecraft-green-light);
}

.news-title::after {
  content: '';
  display: block;
  height: 14px;
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
  transform: scaleY(57.14%);
  width: 14px;
  margin-left: auto;
}

.news-title[stat='active']::after {
  transform: rotate(180deg) scaleY(57.14%);
}

.news-title-item {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.news-title-item.sort-by {
  flex: 1;
  justify-content: end;
  margin-left: auto;
}

.news-title-options {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 10.5rem;
  min-height: 10.5rem;
  height: auto;
  outline: 1px solid var(--minecraft-green-light);

  position: absolute;
  left: 0;
  top: 3.5rem;
  z-index: 1000;
}

.news-title-option {
  padding: 0 1rem;
  display: flex;
  align-items: center;
  font-size: 1.5rem;
  width: 10.5rem;
  flex: 1;
  border: none;
  border-radius: 0;
  background-color: rgba(0, 0, 0, 0.6);
}

.news-title-option[stat='active'] {
  z-index: 1002;
  padding: 0 calc(1rem - 2px);
  border: 2px solid var(--minecraft-green-light);
  background-color: rgba(0, 0, 0, 0.8);
}

.news-title-option[stat='active']::after {
  content: '';
  display: inline-block;
  height: 12px;
  background-color: #a0e081;
  flex-shrink: 0;
  width: 16px;
  mask-image: url('data:image/svg+xml;utf8,<svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg"><g><rect y="6" width="2" height="2" fill="white"/><rect x="2" y="8" width="2" height="2" fill="white"/><rect x="4" y="10" width="2" height="2" fill="white"/><rect x="6" y="8" width="2" height="2" fill="white"/><rect x="8" y="6" width="2" height="2" fill="white"/><rect x="10" y="4" width="2" height="2" fill="white"/><rect x="12" y="2" width="2" height="2" fill="white"/><rect x="14" width="2" height="2" fill="white"/></g></svg>');
  margin-left: auto;
}

.news-title-option:hover {
  background-color: #000;
}

.news-title:focus-visible,
.news-title-option:focus-visible {
  outline: 2px solid var(--minecraft-green-light);
  outline-offset: -2px;
  z-index: 1003;
}

.news-total {
  font-size: 1.2rem;
  user-select: none;
  margin-left: 1rem;
  color: #aba09c;
}

.news-sort-by {
  font-size: 1.2rem;
  user-select: none;
  text-wrap: nowrap;
}

.news-sort-by-option {
  font-size: 1.2rem;
  margin: 0 1rem;
  color: var(--minecraft-green-light);
  text-wrap: nowrap;
}

.news-list-loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 40rem;
}

.news-list-loading {
  user-select: none;
  width: 16rem;
  height: 16rem;
}

.news-list-container {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(17.5rem, 21.75rem));
  gap: 2rem;
  padding: 1rem 0;
  justify-content: center;
}

.news-list-item {
  align-items: flex-start !important;
  opacity: 0;
  animation: fade-in-down 0.5s ease-in-out forwards;
  animation-delay: var(--delay);
}

.news-pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-bottom: 1rem;
}

.news-pagination-item {
  display: inline-flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: center;
  height: 2rem;
  margin-top: 1rem;
}

.news-pagination-button {
  font-size: 1.5rem;
  height: 2rem;
  width: 2rem;
}

.news-pagination-text {
  user-select: none;
  font-size: 1.5rem;
  margin: 0 0.5rem;
}

.news-pagination-text.special {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  height: 2rem;
  padding: 4px;
  margin: 0;
  font-size: 1rem;
}

.news-pagination-text.page {
  border: 1px solid #a0e081;
}

.news-pagination-text.total {
  border: 1px solid white;
}

.news-pagination-input {
  height: 2rem;
  width: 3rem;
  font-size: 1rem;
  text-align: center;
}

@media screen and (max-width: 800px) {
  .news-list-panel {
    width: 100% !important;
    margin: 0 !important;
  }

  .news-list-container {
    grid-template-columns: repeat(1, minmax(17.5rem, 21.75rem));
  }
}
</style>
