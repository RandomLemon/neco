<script lang="ts" setup>
import { useRouter } from 'vue-router'
import MinecraftButton from '@/components/utils/MinecraftButton.vue'
import type { NewsEntity } from '@/api/newslist'

const router = useRouter()

const emit = defineEmits(['jump'])

const newTab = (url: string) => {
  const audio = new Audio('/button.click.ogg')
  audio.play()
  audio.volume = 0.3
  const target = router.resolve(url)
  window.open(target.href, '_blank')
}

const props = defineProps({
  newsBrief: {
    type: Object as () => NewsEntity,
    required: true,
  },
  buttonText: {
    type: String,
    default: '了解更多',
  },
  buttonClick: {
    type: Function,
    default: () => {
      const newsList = document.getElementById('news-list')
      if (newsList) {
        newsList.scrollIntoView({ behavior: 'smooth' })
      }
    },
  },
})
</script>

<template>
  <div class="overview-card">
    <a
      class="overview-link"
      :href="`/news/detail/${props.newsBrief.id}`"
      target="_blank"
      rel="noopener noreferrer"
      @click.prevent="newTab(`/news/detail/${props.newsBrief.id}`)"
    >
      <picture style="overflow: hidden">
        <img
          class="overview-img"
          :src="props.newsBrief.image"
          :alt="`${props.newsBrief.title} 封面`"
        />
      </picture>

      <span class="overview title">
        {{ props.newsBrief.title }}
      </span>
    </a>
    <div class="overview-content">
      <span class="overview">
        {{ props.newsBrief.brief }}
      </span>
      <MinecraftButton class="overview button" @click="emit('jump')">
        {{ props.buttonText }}
        <div style="width: 1.2rem"></div>
        >
      </MinecraftButton>
    </div>
  </div>
</template>

<style lang="css" scoped>
.overview-link {
  color: inherit;
  text-decoration: none;
  display: contents;
}

.overview-link:focus-visible .overview-img,
.overview-link:focus-visible .overview.title {
  outline: 3px solid #fff;
  outline-offset: 3px;
}

.overview-card {
  opacity: 0;
  flex: 1;
  display: flex;
  width: 100%;
  background-color: var(--background-card);
}

.overview-content {
  display: flex;
  flex-direction: column;
}

.overview {
  margin-right: 1rem;
  margin-left: 1rem;
  margin-top: 1rem;
  user-select: none;
}

.overview.title {
  font-size: 1.3rem;
  cursor: pointer;
}

.overview.title:hover {
  text-decoration: underline;
}

.overview.button {
  height: 3.5rem;
  width: 12rem;
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

.overview-img {
  height: 100%;
  object-fit: cover;
  object-position: center;
  max-width: 100%;
  width: 100%;
  vertical-align: middle;
  border-style: none;
  transition: transform 0.3s ease-in-out;
  cursor: pointer;
  user-select: none;
}

.overview-card:hover .overview-img {
  transform: scale(1.1);
}
</style>
