<script lang="ts" setup>
import { GetNewsDetail, type NewsDetail } from '@/api/newslist'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { MdPreview } from 'md-editor-v3'
import MinecraftButton from '@/components/utils/MinecraftButton.vue'
import PdfViewer from '@/components/PdfViewer.vue'

const route = useRoute()
const newsDetail = ref<NewsDetail | null>(null)
const posterFailed = ref(false)
const posterReady = ref(false)
const posterPortrait = ref(false)

const fallbackPoster = '/nmo-logo-large.png'

const posterImage = computed(() => {
  const image = newsDetail.value?.entity.image?.trim()
  return posterFailed.value || !image ? fallbackPoster : image
})

const posterStyle = computed(() => ({
  '--poster-url': `url('${posterImage.value}')`,
}))

const dateText = computed(() => {
  const entity = newsDetail.value?.entity
  if (!entity) return ''

  const endDate = entity.endDate?.trim()
  return endDate ? `${entity.date} ~ ${endDate}` : entity.date
})

const authorTags = computed(() => newsDetail.value?.author.tags || [])

const scrollToIndex = (index: number) => {
  const element = document.getElementById(`pdf-renderer-${index}`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const onPosterLoad = (event: Event) => {
  const image = event.target as HTMLImageElement
  posterPortrait.value = image.naturalHeight > image.naturalWidth * 1.08
  posterReady.value = true
}

const onPosterError = () => {
  if (!posterFailed.value) {
    posterFailed.value = true
    return
  }
  posterReady.value = true
}

const soundOn = () => {
  const audio = new Audio('/button.click.ogg')
  audio.volume = 0.3
  audio.play().catch(() => {})
}

const mountSounds = () => {
  const buttons = document.querySelectorAll(
    '.md-editor-copy-button, .md-editor-collapse-tips, .md-editor-code-flag',
  )
  buttons.forEach((button) => {
    button.addEventListener('click', soundOn)
  })
}

watch(
  () => newsDetail.value?.entity.image,
  () => {
    posterFailed.value = false
    posterReady.value = false
    posterPortrait.value = false
  },
)

onMounted(async () => {
  newsDetail.value = await GetNewsDetail(String(route.params.id))
})
</script>

<template>
  <div class="news-detail-container">
    <section v-if="!newsDetail" class="news-detail-loading nmo-card-soft" role="status">
      <img src="/loading.gif" alt="" />
      <span>正在加载文章...</span>
    </section>

    <template v-else>
      <section class="news-hero nmo-hero-panel">
        <div class="news-hero-copy">
          <div class="news-hero-meta">
            <span class="news-category-chip">{{ newsDetail.category }}</span>
            <time>{{ dateText }}</time>
          </div>
          <h1 class="news-hero-title title-font">{{ newsDetail.entity.title }}</h1>
          <p class="news-hero-brief">{{ newsDetail.entity.brief }}</p>
        </div>

        <picture
          class="news-poster"
          :class="{
            'is-ready': posterReady,
            'is-portrait': posterPortrait,
          }"
          :style="posterStyle"
        >
          <img
            class="news-poster-img"
            :src="posterImage"
            :alt="`${newsDetail.entity.title || '新闻'} 封面`"
            @load="onPosterLoad"
            @error="onPosterError"
          />
        </picture>
      </section>

      <article class="news-detail-content">
        <aside class="news-detail-author-container">
          <div class="news-detail-author nmo-card">
            <picture class="news-detail-author-avatar">
              <img
                class="news-detail-author-avatar-img"
                :src="newsDetail.author.avatar || '/nmo-logo-large.png'"
                :alt="`${newsDetail.author.username || '作者'} 的头像`"
              />
            </picture>

            <div class="news-detail-author-info">
              <section class="news-detail-author-info-item">
                <div class="news-detail-author-title">作者</div>
                <div class="news-detail-author-text">{{ newsDetail.author.username || 'NMO' }}</div>
                <div class="news-detail-author-name-container" v-if="authorTags.length > 0">
                  <div
                    class="news-detail-author-tag"
                    v-for="tag in authorTags"
                    :key="tag.text"
                    :style="{
                      backgroundColor: tag.tagColor,
                      color: tag.color,
                    }"
                  >
                    {{ tag.text }}
                  </div>
                </div>
              </section>

              <section class="news-detail-author-info-item">
                <div class="news-detail-author-title">
                  {{ newsDetail.entity.endDate?.trim() ? '起止日期' : '发布日期' }}
                </div>
                <div class="news-detail-author-text">{{ dateText }}</div>
              </section>
            </div>
          </div>
        </aside>

        <main class="news-main-content">
          <header class="news-content-header">
            <span>正文</span>
          </header>

          <div class="news-main-item-list">
            <div class="news-main-item" v-for="(item, index) in newsDetail.content" :key="index">
              <MdPreview
                v-if="item.type === 'markdown'"
                theme="dark"
                language="zh-CN"
                preview-theme="minecraft"
                :model-value="item.content"
                @on-remount="mountSounds"
              />

              <template v-else-if="item.type === 'pdf_file'">
                <MinecraftButton class="pdf-read-btn" @click="scrollToIndex(index)">
                  ↓ 最佳阅读位置
                </MinecraftButton>
                <PdfViewer
                  :id="`pdf-renderer-${index}`"
                  class="pdf-renderer mc-border"
                  :pdf-url="item.content"
                />
              </template>
            </div>
          </div>
        </main>
      </article>
    </template>
  </div>
</template>

<style lang="css" scoped>
.news-detail-container {
  width: 100%;
  min-height: 100vh;
  padding: 6rem clamp(1rem, 4vw, 4rem) 3rem;
  background:
    linear-gradient(to right, rgba(0, 0, 0, 0.78), rgba(0, 0, 0, 0.42), rgba(0, 0, 0, 0.78)),
    radial-gradient(circle at 50% 12%, rgba(108, 195, 73, 0.14), transparent 28rem),
    url('/blockbg/deepslate-tiles.png');
  background-size:
    auto,
    auto,
    32px 32px;
}

.news-detail-loading {
  width: min(100%, 72rem);
  min-height: 24rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: rgba(255, 255, 255, 0.78);
  font-size: 1.2rem;
}

.news-detail-loading img {
  width: 7rem;
  height: 7rem;
  image-rendering: pixelated;
  user-select: none;
}

.news-hero {
  display: flex;
  gap: clamp(1rem, 3vw, 2.5rem);
  width: min(100%, 88rem);
  margin: 0 auto 1.5rem;
  padding: clamp(1rem, 3vw, 2.5rem);
  min-height: 26rem;
}

.news-hero-copy {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
}

.news-hero-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
}

.news-category-chip {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 0.25rem 0.65rem;
  color: #101010;
  background-color: var(--minecraft-green-light);
  box-shadow:
    inset -2px -2px 0 0 var(--minecraft-green-dark),
    inset 2px 2px 0 0 rgba(255, 255, 255, 0.45),
    2px 2px 0 rgba(0, 0, 0, 0.35);
  user-select: none;
}

.news-hero-title {
  margin: 0;
  color: #fff;
  font-size: clamp(1.2rem, 3.2vw, 2.5rem);
  line-height: 1.08;
  word-break: break-word;
  text-shadow: 4px 4px 0 rgba(0, 0, 0, 0.55);
}

.news-hero-brief {
  max-width: 46rem;
  margin: 0;
  color: rgba(255, 255, 255, 0.78);
  font-size: clamp(1.2rem, 1.8vw, 1.5rem);
  line-height: 1.8;
  word-break: break-word;
}

.news-poster {
  flex: 1;
  position: relative;
  isolation: isolate;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 18rem;
  overflow: hidden;
  background-color: #101010;
  border: 4px solid #222;
  box-shadow:
    inset -3px -3px 0 0 #151515,
    inset 3px 3px 0 0 #4d4d4d,
    0 0.7rem 1.6rem rgba(0, 0, 0, 0.32);
}

.news-poster::before {
  position: absolute;
  inset: -1.5rem;
  z-index: -1;
  content: '';
  background-image: var(--poster-url);
  background-size: cover;
  background-position: center;
  opacity: 0.42;
  filter: blur(18px);
  transform: scale(1.08);
}

.news-poster-img {
  width: 100%;
  height: 100%;
  max-height: 24rem;
  object-fit: cover;
  object-position: center;
  opacity: 0;
  transform: scale(1.02);
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
  user-select: none;
}

.news-poster.is-ready .news-poster-img {
  opacity: 1;
  transform: scale(1);
}

.news-poster.is-portrait .news-poster-img {
  width: auto;
  max-width: 78%;
  object-fit: contain;
  padding: 0.75rem;
}

.news-detail-content {
  display: grid;
  grid-template-columns: 16rem minmax(0, 1fr);
  gap: 1.5rem;
  width: min(100%, 88rem);
  margin: 0 auto;
  align-items: start;
}

.news-detail-author-container {
  position: sticky;
  top: 6rem;
  min-width: 0;
}

.news-detail-author {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1rem;
}

.news-detail-author-avatar {
  width: 6.5rem;
  height: 6.5rem;
  border-radius: 50%;
  overflow: hidden;
  outline: 2px solid var(--minecraft-gray-light);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.36);
}

.news-detail-author-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  vertical-align: middle;
  border-style: none;
  user-select: none;
}

.news-detail-author-info {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  gap: 1rem;
}

.news-detail-author-info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 0.85rem;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.news-detail-author-title {
  margin-bottom: 0.35rem;
  color: var(--minecraft-green-light);
  font-size: 0.95rem;
  font-weight: 700;
  user-select: none;
}

.news-detail-author-text {
  max-width: 100%;
  margin-bottom: 0.5rem;
  color: rgba(255, 255, 255, 0.88);
  font-size: 0.95rem;
  font-weight: 500;
  text-align: center;
  word-break: break-word;
  user-select: none;
}

.news-detail-author-name-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0.35rem;
}

.news-detail-author-tag {
  max-width: 100%;
  padding: 2px 5px;
  border-radius: 4px;
  font-size: 0.75rem;
  word-break: break-word;
  user-select: none;
}

.news-main-content {
  min-width: 0;
  margin-bottom: 4rem;
  overflow: hidden;
  background-color: rgba(12, 12, 12, 0.72);
  border: 4px solid #222;
  box-shadow:
    inset -4px -4px 0 0 #1a1a1a,
    inset 4px 4px 0 0 #474747,
    0 0.75rem 1.8rem rgba(0, 0, 0, 0.3);
}

.news-content-header {
  display: flex;
  align-items: center;
  height: 3rem;
  padding: 0 1.25rem;
  color: #fff;
  background:
    linear-gradient(to right, rgba(60, 133, 39, 0.8), rgba(42, 100, 28, 0.2)),
    url('/blockbg/moss-block.png');
  background-size:
    auto,
    32px 32px;
  border-bottom: 4px solid #1a1a1a;
  user-select: none;
}

.news-main-item-list {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: clamp(1rem, 3vw, 2.5rem);
}

.news-main-item {
  width: 100%;
  min-width: 0;
  margin: 0.5rem 0 1.5rem;
}

.news-main-item:last-child {
  margin-bottom: 0;
}

.news-main-item :deep(.md-editor) {
  background: transparent;
}

.news-main-item :deep(.md-editor-preview-wrapper) {
  padding: 0;
  background: transparent;
}

.news-main-item :deep(.md-editor-preview) {
  color: rgba(255, 255, 255, 0.86);
}

.pdf-read-btn {
  height: 3rem;
  margin: 1rem 0;
  font-size: 1.05rem;
}

.pdf-renderer {
  width: 100%;
  height: min(100vh, 54rem);
  margin: 1rem 0 2rem;
  background-color: rgba(0, 0, 0, 0.45);
}

@media screen and (max-width: 1024px) {
  .news-hero {
    grid-template-columns: 1fr;
  }

  .news-poster {
    min-height: 20rem;
  }

  .news-detail-content {
    grid-template-columns: 1fr;
  }

  .news-detail-author-container {
    position: static;
  }

  .news-detail-author {
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
  }

  .news-detail-author-info {
    flex: 1;
    flex-direction: row;
    align-items: stretch;
    gap: 0.75rem;
  }

  .news-detail-author-info-item {
    flex: 1;
    border-top: 0;
    border-left: 1px solid rgba(255, 255, 255, 0.12);
    padding-top: 0;
    padding-left: 0.75rem;
  }
}

@media screen and (max-width: 640px) {
  .news-detail-container {
    padding: 5.25rem 0.75rem 2rem;
  }

  .news-hero {
    min-height: 0;
    padding: 1rem;
  }

  .news-hero-title {
    font-size: clamp(1.8rem, 10vw, 2.6rem);
  }

  .news-poster {
    min-height: 14rem;
  }

  .news-poster-img {
    max-height: 18rem;
  }

  .news-detail-author {
    flex-direction: column;
  }

  .news-detail-author-info {
    flex-direction: column;
  }

  .news-detail-author-info-item {
    border-left: 0;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    padding-left: 0;
    padding-top: 0.75rem;
  }

  .news-content-header {
    height: 2.75rem;
  }

  .news-main-item-list {
    padding: 1rem;
  }

  .pdf-renderer {
    height: 80vh;
  }
}
</style>
