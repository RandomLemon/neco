<script lang="ts" setup>
import type { NewsEntity } from '@/api/newslist'
import MinecraftButton from '@/components/utils/MinecraftButton.vue'

const emits = defineEmits(['card-click'])

const props = defineProps({
  news: {
    type: Object as () => NewsEntity,
    required: true,
  },
})
</script>

<template>
  <MinecraftButton class="news-item-card" @click="emits('card-click')">
    <picture class="news-item-picture">
      <img class="news-item-image" :src="props.news.image" :alt="`${props.news.title} 封面`" />
    </picture>
    <span class="news-item-title">{{ props.news.title }}</span>
    <span class="news-item-description">{{ props.news.brief }}</span>
    <time class="news-item-date" :datetime="props.news.date">
      {{ props.news.date }}
    </time>
  </MinecraftButton>
</template>

<style lang="css" scoped>
.news-item-card {
  width: 100%;
  height: 21.75rem;
  padding: 1rem;
  margin: 1rem auto;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.news-item-picture {
  width: 100%;
  height: 10rem;
  user-select: none;
}

.news-item-image {
  height: 100%;
  object-fit: cover;
  object-position: center;
  max-width: 100%;
  width: 100%;
  vertical-align: middle;
  border-style: none;
  cursor: pointer;
  user-select: none;
}

.news-item-title {
  font-size: 1.5rem;
  margin: 1rem 0;
  user-select: none;
}

.news-item-description {
  user-select: none;
}

.news-item-date {
  margin-top: auto;
  user-select: none;
}
</style>
