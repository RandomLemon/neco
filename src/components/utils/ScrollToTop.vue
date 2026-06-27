<script lang="ts" setup>
import { ref } from 'vue'
import MinecraftButton from './MinecraftButton.vue'

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

const shouldShow = ref(false)

window.addEventListener('scroll', () => {
  shouldShow.value = window.scrollY > 200
})
</script>

<template>
  <MinecraftButton
    class="scroll-to-top"
    :class="{ 'is-show': shouldShow }"
    :aria-hidden="!shouldShow"
    :tabindex="shouldShow ? 0 : -1"
    :disabled="!shouldShow"
    aria-label="返回页面顶部"
    @click="scrollToTop"
  >
    <span aria-hidden="true">↑</span>
  </MinecraftButton>
</template>

<style lang="css" scoped>
.scroll-to-top {
  font-size: 1.5rem;
  position: fixed;
  height: 3rem;
  width: 3rem;
  right: 0;
  bottom: 0;
  z-index: 1024;

  transform: translateY(120%);
  opacity: 0;
  pointer-events: none;

  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}

.scroll-to-top.is-show {
  transform: translateY(0);
  opacity: 1;
  pointer-events: auto;
}
</style>
