<script lang="ts" setup>
import { GetNewsDetail, type NewsDetail } from '@/api/newslist'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { MdPreview } from 'md-editor-v3'
import MinecraftButton from '@/components/utils/MinecraftButton.vue'

const newsId = useRoute().params.id
const newsDetail = ref<NewsDetail | null>(null)

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

onMounted(async () => {
  newsDetail.value = await GetNewsDetail(newsId as string)
})
</script>

<template>
  <div class="news-detail-container">
    <picture class="news-poster">
      <img class="news-poster-img" :src="newsDetail?.entity.image" alt="Detail image" />
      <text class="news-poster-category">
        {{ newsDetail?.category }}
      </text>
    </picture>
    <article class="news-detail-content">
      <aside class="news-detail-author-container">
        <div class="news-detail-author">
          <picture class="news-detail-author-avatar">
            <img
              class="news-detail-author-avatar-img"
              :src="newsDetail?.author.avatar"
              alt="Author avatar"
            />
          </picture>
          <div class="news-detail-author-info">
            <div class="news-detail-author-info-item">
              <div class="news-detail-author-title">作者</div>
              <div class="news-detail-author-text">{{ newsDetail?.author.username }}</div>
              <div
                class="news-detail-author-name-container"
                v-if="(newsDetail?.author.tags || []).length > 0"
              >
                <div
                  class="news-detail-author-tag"
                  v-for="tag in newsDetail?.author.tags"
                  :key="tag.text"
                  :style="{
                    backgroundColor: tag.tagColor,
                    color: tag.color,
                  }"
                >
                  {{ tag.text }}
                </div>
              </div>
            </div>
            <div
              class="news-detail-author-info-item"
              v-if="newsDetail?.entity.endDate === undefined"
            >
              <div class="news-detail-author-title">发布日期</div>
              <div class="news-detail-author-text">{{ newsDetail?.entity.date }}</div>
            </div>
            <div class="news-detail-author-info-item" v-else>
              <div class="news-detail-author-title">起止日期</div>
              <div class="news-detail-author-text">
                {{ `${newsDetail?.entity.date} ~ ${newsDetail?.entity.endDate}` }}
              </div>
            </div>
          </div>
        </div>
      </aside>
      <main class="news-main-content">
        <div class="news-main-item-list">
          <div class="news-main-item" v-for="(item, index) in newsDetail?.content" :key="index">
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
    </article>
  </div>
</template>

<style lang="css" scoped>
.news-detail-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  padding-top: 5rem;

  background:
    linear-gradient(to right, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.4)),
    radial-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.8)), url('/blockbg/dirt.png');
}

.news-poster {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.news-poster-img {
  width: 85%;
  margin-bottom: 3rem;
  height: 100%;
  object-fit: cover;
  object-position: center;
  vertical-align: middle;
  border-style: none;
  user-select: none;
}

.news-poster-category {
  font-size: 1.2rem;
  color: rgb(29, 30, 30);
  background-color: #fff;
  padding: 0 8px;
  position: absolute;
  bottom: 2.5rem;
  box-shadow: rgba(0, 0, 0, 0.3) 2px 2px 0px 0px;
  user-select: none;
}

.news-detail-content {
  width: 85%;
  display: flex;
  flex-wrap: nowrap;
}

.news-detail-author-container {
  width: 21rem;
}

.news-detail-author {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 12.5rem;
  margin-bottom: 4rem;
}

.news-detail-author-avatar {
  width: 6rem;
  height: 6rem;
  border-radius: 50%;
  overflow: hidden;
  outline: 2px solid var(--minecraft-gray-light);
}

.news-detail-author-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.news-detail-author-info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.news-detail-author-avatar-img {
  width: 6rem;
  height: 6rem;
  object-fit: cover;
  object-position: center;
  vertical-align: middle;
  border-style: none;
  user-select: none;
}

.news-detail-author-title {
  user-select: none;
  color: #fff;
  font-size: 1.2rem;
  margin: 0.5rem 0;
  font-weight: 700;
}

.news-detail-author-text {
  user-select: none;
  font-size: 1rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
  text-wrap: nowrap;
}

.news-detail-author-name-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
}

.news-detail-author-tag {
  user-select: none;
  font-size: 0.8rem;
  padding: 2px 4px;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  text-wrap: unwrap;
}

.news-main-content {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: fit-content;
  margin-bottom: 4rem;
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

@media screen and (max-width: 768px) {
  .news-detail-content {
    flex-direction: column;
    align-items: center;
    width: 100%;
  }

  .news-detail-author-container {
    display: flex;
    justify-content: center;
  }

  .news-detail-author {
    flex-direction: row;
    width: auto;
    gap: 1rem;
    margin-bottom: 0;
  }

  .news-main-item-list {
    padding: 1rem 2rem;
  }

  .news-main-item {
    padding: 0;
  }
}
</style>
