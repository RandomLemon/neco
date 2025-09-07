<script lang="ts" setup>
import { ref } from 'vue'

const soundOn = () => {
  const audio = new Audio('/button.click.ogg')
  audio.play()
  audio.volume = 0.3
}
const pressed = ref(false)

const props = defineProps({
  height: {
    type: String,
    default: '12rem',
  },
})
</script>

<template>
  <div
    class="minecraft-button-3d"
    :class="{
      'is-pressed': pressed,
    }"
    :style="{
      height: pressed ? `calc(${props.height} - 12px)` : props.height,
    }"
    @click="soundOn"
    @mousedown="pressed = true"
    @mouseup="pressed = false"
    @mouseleave="pressed = false"
  >
    <slot></slot>
  </div>
</template>

<style lang="css" scoped>
.minecraft-button-3d {
  padding: 1rem 2rem;
  position: relative;
  cursor: pointer;
  user-select: none;
  background-color: #313233;
  border: 2px solid rgba(0, 0, 0, 0.4);
  transition: all 0.1s ease-in-out;

  box-shadow: 4px 4px rgba(0, 0, 0, 0.7);
}

.minecraft-button-3d:hover::after {
  background-color: #ffffff08;
}

.minecraft-button-3d.is-pressed {
  transform: translateY(12px);
  margin-bottom: 12px;
}

.minecraft-button-3d.is-pressed::after {
  box-shadow:
    2px 2px 0 0 rgba(178, 178, 178, 0.5) inset,
    -2px -2px 0 0 rgba(153, 153, 153, 0.5) inset;
}

.minecraft-button-3d::after {
  display: block;
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  box-shadow:
    0 -12px 0 0 rgb(104, 104, 104) inset,
    2px 2px 0 0 rgba(178, 178, 178, 0.5) inset,
    -2px -16px 0 0 rgba(153, 153, 153, 0.5) inset;
  mix-blend-mode: hard-light;
  pointer-events: none;
  transition: all 0.1s ease-in-out;
}
</style>
