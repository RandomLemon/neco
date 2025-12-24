<script lang="ts" setup>
import type { NewsEntity } from '@/api/newslist'
import MinecraftButton3D from '@/components/utils/MinecraftButton3D.vue'
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  activity: {
    type: Object as () => NewsEntity,
    required: true,
  },
})

const isMobile = ref(false)
const check = () => (isMobile.value = window.innerWidth < 947)

const isActive = computed(() => {
  const currentDate = new Date()
  const nextYear = new Date(currentDate.getTime())
  nextYear.setFullYear(nextYear.getFullYear() + 1)
  const startDate = new Date(props.activity.date)
  const endDate = new Date(props.activity.endDate ?? nextYear.getTime())
  return currentDate >= startDate && currentDate <= endDate
})

onMounted(() => {
  check()
  window.addEventListener('resize', check)
})
onUnmounted(() => {
  window.removeEventListener('resize', check)
})
</script>

<template>
  <MinecraftButton3D
    class="activity-item"
    :height="isMobile ? '25rem' : '12rem'"
    :style="{
      'background-color': isActive ? 'rgb(45, 72, 31)' : 'rgb(88, 46, 46)',
    }"
    @click="$router.push(`/news/detail/${props.activity.id}`)"
  >
    <img :src="props.activity.image" :alt="props.activity.title + ' image'" />

    <div class="activity-info">
      <div class="activity-title">
        {{ props.activity.title }}
        <div class="activity-status" :type="isActive ? 'active' : 'inactive'">
          {{ isActive ? '进行中' : '已结束' }}
        </div>
      </div>
      <div class="activity-date">
        {{ `${props.activity.date} ~ ${props.activity.endDate ?? '长期'}` }}
      </div>
      <div class="activity-brief">
        {{ props.activity.brief }}
      </div>
    </div>
  </MinecraftButton3D>
</template>

<style lang="css" scoped>
.activity-item {
  margin: 0 auto;

  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  width: 100%;
  max-width: 1024px;
}

.activity-item img {
  height: 9rem;
  width: 16rem;
  overflow: hidden;
  user-select: none;
  object-fit: cover;
}

.activity-info {
  display: flex;
  flex-direction: column;
  padding-left: 2rem;
}

.activity-title {
  display: flex;
  align-items: center;
  color: #fff;
  font-size: 1.5rem;
}

.activity-status {
  color: #f56c6c;
  border-radius: 4px;
  margin-left: 0.5rem;
  padding: 3px 8px;
  background-color: rgb(88, 46, 46);
  font-size: 0.9rem;
}

.activity-status[type='active'] {
  color: #67c23a;
  background-color: rgb(45, 72, 31);
}

.activity-date {
  margin: 0.5rem 0;
  font-size: 0.8rem;
}

.activity-brief {
  font-size: 1rem;
  color: #eee;
}

@media screen and (max-width: 524px) {
  .activity-item {
    flex-direction: column;
  }

  .activity-item img {
    width: 100%;
    height: 12rem;
    margin-bottom: 1rem;
  }

  .activity-info {
    padding: 0;
  }
}
</style>
