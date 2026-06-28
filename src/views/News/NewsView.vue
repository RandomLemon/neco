<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { onMounted, ref } from 'vue'
import { GetNewsBrief, type NewsEntity } from '@/api/newslist'
import NewsCard from './NewsCard.vue'
import NewsList from './NewsList.vue'

const router = useRouter()

const newsId = ref('information')
const newsBrief = ref<NewsEntity[]>([])
const newsReady = ref(false)

const scrollToNews = () => {
  const newsList = document.getElementById('news-list')
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

const newTab = (id: string) => {
  const target = router.resolve(`/news/detail/${id}`)
  window.open(target.href, '_blank')
}

onMounted(async () => {
  newsReady.value = false
  newsBrief.value = await GetNewsBrief()
  newsReady.value = true
})
</script>

<template>
  <div class="news-area">
    <section class="news-hero nmo-hero-panel" aria-labelledby="news-hero-title">
      <div class="news-hero-header">
        <div>
          <h1 id="news-hero-title" class="nmo-section-title">新闻与活动</h1>
          <p class="nmo-section-desc">NMO 最近发生了什么事？</p>
        </div>
      </div>

      <div class="news-overview-shell">
        <div
          v-if="!newsReady"
          class="news-overview-loading nmo-card-soft"
          role="status"
          aria-live="polite"
        >
          <img src="/loading.gif" alt="" />
          <span>正在加载新闻内容...</span>
        </div>

        <div v-else class="news-overview-grid assets-ready">
          <NewsCard
            class="news-overview-card card-activity"
            variant="featured"
            image-mode="cover"
            :news-brief="newsBrief[0] ?? {}"
            label="活动"
            button-text="更多活动"
            @jump="router.push(`/activity`)"
          />

          <NewsCard
            class="news-overview-card card-information"
            variant="compact"
            image-mode="cover"
            :news-brief="newsBrief[1] ?? {}"
            label="资讯"
            button-text="更多资讯"
            @jump="((newsId = 'information'), scrollToNews())"
          />

          <NewsCard
            class="news-overview-card card-magazine"
            variant="compact"
            image-mode="portrait"
            :news-brief="newsBrief[2] ?? {}"
            label="社刊"
            button-text="往期社刊"
            @jump="((newsId = 'magazine'), scrollToNews())"
          />

          <NewsCard
            class="news-overview-card card-notice"
            variant="compact"
            image-mode="cover"
            :news-brief="newsBrief[3] ?? {}"
            label="公告"
            button-text="更多公告"
            @jump="((newsId = 'notice'), scrollToNews())"
          />
        </div>
      </div>
    </section>

    <NewsList
      v-model="newsId"
      id="news-list"
      class="news-list-entry"
      @need-scroll="scrollToNews"
      @card-click="newTab"
    />
  </div>
</template>

<style lang="css" scoped>
.news-area {
  width: 100%;
  min-height: calc(100vh - 4rem);
  min-height: calc(100svh - 4rem);
  padding: 4.15rem clamp(1rem, 3.4vw, 3.5rem) 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  box-sizing: border-box;
}

.news-hero {
  width: min(100%, 98rem);
  height: min(43rem, calc(100vh - 5.75rem));
  min-height: calc(100vh - 5rem);
  padding: clamp(0.8rem, 1.45vw, 1.25rem);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  box-sizing: border-box;
}

.news-hero-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: clamp(0.65rem, 1.2vh, 1rem);
}

.news-hero-header .nmo-section-title {
  margin-bottom: 0.35rem;
  font-size: clamp(1.5rem, 2.4vw, 2rem);
  line-height: 1;
}

.news-hero-header .nmo-section-desc {
  max-width: 62rem;
  font-size: clamp(0.92rem, 1.15vw, 1.08rem);
  line-height: 1.45;
  margin: 1rem 0;
}

.news-overview-shell {
  position: relative;
  height: 100%;
  min-height: 0;
}

.news-overview-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.16fr) minmax(16rem, 0.58fr) minmax(13rem, 0.42fr);
  grid-template-rows: minmax(0, 1fr) minmax(12rem, 0.72fr);
  grid-template-areas:
    'activity information information'
    'activity magazine notice';
  gap: clamp(0.65rem, 1.1vw, 1rem);
  height: 100%;
  min-height: 0;
}

.news-overview-grid.assets-ready {
  animation: fade-in-down 0.36s ease-in-out both;
}

.news-overview-card {
  min-width: 0;
  min-height: 0;
}

.card-activity {
  grid-area: activity;
}

.card-information {
  grid-area: information;
}

.card-magazine {
  grid-area: magazine;
}

.card-notice {
  grid-area: notice;
}

.news-overview-loading {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: rgba(255, 255, 255, 0.76);
  font-size: 1.2rem;
}

.news-overview-loading img {
  width: 7rem;
  height: 7rem;
  image-rendering: pixelated;
  user-select: none;
}

@media screen and (max-width: 1180px) {
  .news-area {
    padding-top: 4.5rem;
  }

  .news-hero {
    height: auto;
    min-height: 0;
  }

  .news-overview-grid {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-rows: minmax(18rem, auto) minmax(14rem, auto) minmax(14rem, auto);
    grid-template-areas:
      'activity information'
      'activity magazine'
      'notice notice';
    height: auto;
  }
}

@media screen and (max-width: 760px) {
  .news-area {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }

  .news-hero {
    padding: 0.8rem;
  }

  .news-overview-grid {
    grid-template-columns: 1fr;
    grid-template-rows: none;
    grid-template-areas:
      'activity'
      'information'
      'magazine'
      'notice';
  }
}
</style>
