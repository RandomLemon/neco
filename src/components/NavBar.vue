<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const soundOn = () => {
  const audio = new Audio('/button.click.ogg')
  audio.play()
  audio.volume = 0.3
}

const router = useRouter()

interface NavItem {
  name: string
  url: string
}

const navItems = ref<NavItem[]>([
  { name: '主页', url: '/lobby' },
  { name: '列表', url: '/list' },
  { name: '活动', url: '/activity' },
  { name: '新闻', url: '/news' },
  { name: '关于', url: '/about' },
  { name: '文档', url: '/documents' },
])
const activeIndex = ref<number>(0)
const setIndex = (index: number) => {
  soundOn()
  activeIndex.value = index
  router.push(navItems.value[index].url)
}

const sliderStyle = computed(() => {
  return {
    width: `${100 / navItems.value.length}%`,
    transform: `translateX(${activeIndex.value * 100}%)`,
    transition: 'transform 0.5s ease',
  }
})

onMounted(async () => {
  const path = '/' + router.currentRoute.value.path.split('/')[1]
  navItems.value.forEach((item, index) => {
    if (item.url === path) {
      activeIndex.value = index
    }
  })
  if (path === '/activity') {
    activeIndex.value = 2
  }
})
</script>

<template>
  <div class="nav-container">
    <nav class="nav-bar">
      <div v-for="(item, index) in navItems" :key="index" class="nav-item" @click="setIndex(index)">
        {{ item.name }}
      </div>

      <div class="slider" :style="sliderStyle">
        <div class="slider-box"></div>
      </div>
    </nav>
  </div>
</template>

<style lang="css" scoped>
.nav-container {
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0.5rem;
  left: 50%;
  transform: translateX(-50%);
  min-width: max-content;
  gap: 0.5rem;
}

.nav-bar {
  height: calc(1rem + 28px);
  display: flex;
  border-radius: 0;
  background-color: rgba(0, 0, 0, 0.5);
  border: 2px solid gray;
  position: relative;
  box-shadow: 4px 4px rgba(0, 0, 0, 0.7);
  transition: all 0.3s ease-in-out;
  opacity: 1;
  overflow: hidden;
}

.nav-bar[type='fold'] {
  height: 0;
  opacity: 0;
}

.nav-item {
  position: relative;
  flex: 1;
  text-align: center;
  padding: 10px;
  cursor: pointer;
  z-index: 1;
  transition: color 0.3s ease;
  font-size: 1rem;
}

.slider {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  z-index: 0;
  box-sizing: border-box;
  padding: 4px;
}

.slider-box {
  box-sizing: border-box;
  background-color: var(--minecraft-green);
  border-radius: 0;
  border-top: 4px solid var(--minecraft-green-light);
  border-bottom: 4px solid var(--minecraft-green-dark);
  height: 100%;
  width: 100%;

  box-shadow: 2px 2px rgba(0, 0, 0, 0.5);
}
</style>
