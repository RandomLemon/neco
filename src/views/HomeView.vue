<script setup lang="ts">
import { useRoute } from 'vue-router'
import Footer from '../components/FooterBar.vue'
import NavBar from '../components/NavBar.vue'
import ScrollToTop from '@/components/utils/ScrollToTop.vue'

const route = useRoute()
</script>

<template>
  <div class="page-area">
    <a href="#main-content" class="skip-link">跳到主要内容</a>

    <main id="main-content" tabindex="-1">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <div class="page-container" :key="route.path">
            <component :is="Component" />
          </div>
        </transition>
      </router-view>
    </main>

    <NavBar />
    <Footer />
    <ScrollToTop />
  </div>
</template>

<style lang="css" scoped>
.page-area {
  position: relative;
  overflow: clip;
}

.page-container {
  min-height: 100vh;
  width: 100vw;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
