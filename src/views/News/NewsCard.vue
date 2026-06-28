<script lang="ts" setup>
import { useRouter } from 'vue-router'
import MinecraftButton from '@/components/utils/MinecraftButton.vue'
import type { NewsEntity } from '@/api/newslist'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

const router = useRouter()
const emit = defineEmits<{
  (event: 'jump'): void
  (event: 'image-ready'): void
}>()

const props = defineProps({
  newsBrief: {
    type: Object as () => NewsEntity,
    required: true,
  },
  label: {
    type: String,
    default: '新闻',
  },
  buttonText: {
    type: String,
    default: '了解更多',
  },
  variant: {
    type: String as () => 'featured' | 'compact',
    default: 'compact',
  },
  imageMode: {
    type: String as () => 'cover' | 'portrait',
    default: 'cover',
  },
})

const imageRef = ref<HTMLImageElement | null>(null)
const imageLoaded = ref(false)
const imageFailed = ref(false)
let readyTimer: number | undefined

const hasNews = computed(() => Boolean(props.newsBrief?.id))

const imageSrc = computed(() => {
  if (imageFailed.value) {
    return '/background/links-background.jpg'
  }

  return props.newsBrief?.image || '/background/links-background.jpg'
})

const backgroundImageStyle = computed(() => ({
  '--cover-url': `url('${imageSrc.value}')`,
}))

const detailUrl = computed(() => {
  return hasNews.value ? `/news/detail/${props.newsBrief.id}` : '#'
})

const clearReadyTimer = () => {
  if (readyTimer) {
    window.clearTimeout(readyTimer)
    readyTimer = undefined
  }
}

const markImageReady = () => {
  if (imageLoaded.value) return

  imageLoaded.value = true
  emit('image-ready')
  clearReadyTimer()
}

const prepareImageReadyState = async () => {
  imageLoaded.value = false
  imageFailed.value = false
  clearReadyTimer()

  await nextTick()

  const img = imageRef.value
  if (img?.complete) {
    markImageReady()
  } else {
    readyTimer = window.setTimeout(markImageReady, 1500)
  }
}

watch(() => `${props.newsBrief?.id || ''}-${props.newsBrief?.image || ''}`, prepareImageReadyState)

const onImageLoad = () => {
  markImageReady()
}

const onImageError = () => {
  if (!imageFailed.value) {
    imageFailed.value = true
    readyTimer = window.setTimeout(markImageReady, 800)
    return
  }

  markImageReady()
}

const newTab = () => {
  if (!hasNews.value) return

  const audio = new Audio('/button.click.ogg')
  audio.volume = 0.3
  audio.play().catch(() => {})

  const target = router.resolve(detailUrl.value)
  window.open(target.href, '_blank')
}

onMounted(prepareImageReadyState)

onUnmounted(() => {
  clearReadyTimer()
})
</script>

<template>
  <article
    class="overview-card nmo-card-soft"
    :class="[`variant-${props.variant}`, `image-${props.imageMode}`]"
    :aria-busy="!imageLoaded"
  >
    <a
      class="overview-link"
      :href="detailUrl"
      target="_blank"
      rel="noopener noreferrer"
      :aria-label="hasNews ? `打开新闻：${props.newsBrief.title}` : '暂无新闻'"
      @click.prevent="newTab"
    >
      <picture class="overview-picture" :style="backgroundImageStyle">
        <img
          ref="imageRef"
          class="overview-img"
          :class="{ 'is-loaded': imageLoaded }"
          :src="imageSrc"
          :alt="hasNews ? `${props.newsBrief.title} 封面` : '默认新闻封面'"
          @load="onImageLoad"
          @error="onImageError"
        />
      </picture>
    </a>

    <div class="overview-body">
      <div class="overview-heading-row">
        <span class="overview-label">{{ props.label }}</span>
        <span class="overview-date" v-if="props.newsBrief.date">{{ props.newsBrief.date }}</span>
      </div>

      <a
        class="overview-title"
        :href="detailUrl"
        target="_blank"
        rel="noopener noreferrer"
        @click.prevent="newTab"
      >
        {{ props.newsBrief.title || '暂无内容' }}
      </a>

      <p class="overview-brief">
        {{ props.newsBrief.brief || '这里还没有可展示的内容。' }}
      </p>

      <MinecraftButton class="overview-button" @click="emit('jump')">
        {{ props.buttonText }}
        <span aria-hidden="true" class="overview-button-arrow">›</span>
      </MinecraftButton>
    </div>
  </article>
</template>

<style lang="css" scoped>
.overview-card {
  display: grid;
  overflow: hidden;
  min-width: 0;
  min-height: 0;
  background-color: rgba(24, 24, 24, 0.9);
}

.overview-card.variant-featured {
  grid-template-rows: minmax(0, 1fr) auto;
}

.overview-card.variant-compact {
  grid-template-columns: minmax(8rem, 42%) minmax(0, 1fr);
  grid-template-rows: 1fr;
}

.overview-card.variant-compact.image-portrait,
.overview-card.card-magazine.image-portrait {
  grid-template-columns: clamp(9.25rem, 42%, 11.75rem) minmax(0, 1fr);
}

.overview-card.card-notice {
  grid-template-columns: 1fr;
  grid-template-rows: minmax(0, 45%) minmax(0, 55%);
}

.overview-link {
  display: block;
  min-width: 0;
  min-height: 0;
  color: inherit;
  text-decoration: none;
}

.overview-link:focus-visible,
.overview-title:focus-visible {
  outline: 3px solid #fff;
  outline-offset: -3px;
}

.overview-picture {
  position: relative;
  isolation: isolate;
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background-color: #111;
}

.overview-picture::before {
  position: absolute;
  inset: -1rem;
  z-index: -1;
  content: '';
  background-image: var(--cover-url);
  background-size: cover;
  background-position: center;
  filter: blur(16px);
  opacity: 0;
  transform: scale(1.08);
}

.image-portrait .overview-picture::before {
  opacity: 0.46;
}

.overview-img {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  object-fit: cover;
  object-position: center;
  opacity: 0;
  transition:
    opacity 0.22s ease-in-out,
    transform 0.25s ease-in-out;
  user-select: none;
}

.overview-img.is-loaded {
  opacity: 1;
}

.image-portrait .overview-img {
  padding: 0.45rem;
  object-fit: contain;
  background-color: rgba(0, 0, 0, 0.32);
}

.overview-card:hover .overview-img {
  transform: scale(1.05);
}

.overview-card.image-portrait:hover .overview-img {
  transform: scale(1.02);
}

.overview-body {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  gap: 0.5rem;
  min-width: 0;
  min-height: 0;
  padding: clamp(0.7rem, 1.1vw, 0.95rem);
  background-color: rgba(24, 24, 24, 0.88);
}

.overview-card.variant-featured .overview-body {
  min-height: clamp(8.2rem, 18vh, 10.6rem);
}

.overview-card.variant-compact .overview-body {
  gap: 0.38rem;
  padding: clamp(0.65rem, 0.95vw, 0.85rem);
  min-height: 0;
}

.overview-card.card-notice .overview-body {
  gap: 0.32rem;
  padding: 0.7rem;
}

.overview-heading-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-width: 0;
}

.overview-label {
  flex: 0 0 auto;
  color: var(--minecraft-green-light);
  font-size: 0.85rem;
}

.overview-date {
  min-width: 0;
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.overview-title {
  min-width: 0;
  color: #fff;
  font-size: clamp(1.08rem, 1.35vw, 1.35rem);
  line-height: 1.25;
  text-decoration: none;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
}

.variant-featured .overview-title {
  line-clamp: 2;
  -webkit-line-clamp: 2;
}

.variant-compact .overview-title {
  font-size: clamp(1rem, 1.08vw, 1.16rem);
  line-clamp: 2;
  -webkit-line-clamp: 2;
}

.card-notice .overview-title {
  font-size: clamp(0.94rem, 1vw, 1.05rem);
  line-clamp: 2;
  -webkit-line-clamp: 2;
}

.overview-title:hover {
  text-decoration: underline;
}

.overview-brief {
  margin: 0;
  min-width: 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.9rem;
  line-height: 1.35rem;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
}

.variant-featured .overview-brief {
  line-clamp: 2;
  -webkit-line-clamp: 2;
}

.variant-compact .overview-brief {
  font-size: 0.84rem;
  line-height: 1.22rem;
  line-clamp: 1;
  -webkit-line-clamp: 1;
}

.card-information .overview-brief,
.card-magazine .overview-brief {
  line-clamp: 2;
  -webkit-line-clamp: 2;
}

.card-notice .overview-brief {
  display: none;
}

.overview-button {
  align-self: end;
  justify-self: start;
  width: min(10.5rem, 100%);
  height: 2.9rem;
  font-size: 0.96rem;
}

.variant-compact .overview-button {
  width: min(9.6rem, 100%);
  height: 2.55rem;
  font-size: 0.9rem;
}

.card-notice .overview-button {
  width: 100%;
  height: 2.35rem;
  font-size: 0.82rem;
}

.overview-button-arrow {
  margin-left: 0.75rem;
  font-size: 1.2rem;
}

@media screen and (max-width: 1180px) {
  .overview-card.variant-featured {
    grid-template-rows: 12rem auto;
  }

  .overview-card.variant-compact,
  .overview-card.variant-compact.image-portrait,
  .overview-card.card-magazine.image-portrait {
    grid-template-columns: minmax(9rem, 36%) minmax(0, 1fr);
  }

  .overview-card.card-notice {
    grid-template-columns: minmax(10rem, 38%) minmax(0, 1fr);
    grid-template-rows: 1fr;
  }

  .card-notice .overview-brief {
    display: -webkit-box;
  }
}

@media screen and (max-width: 760px) {
  .overview-card.variant-compact,
  .overview-card.variant-featured,
  .overview-card.variant-compact.image-portrait,
  .overview-card.card-magazine.image-portrait,
  .overview-card.card-notice {
    grid-template-columns: 1fr;
    grid-template-rows: 11rem auto;
  }

  .image-portrait .overview-picture {
    min-height: 14rem;
  }

  .overview-button,
  .variant-compact .overview-button,
  .card-notice .overview-button {
    width: 100%;
  }
}
</style>
