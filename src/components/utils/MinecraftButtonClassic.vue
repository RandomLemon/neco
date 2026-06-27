<script lang="ts" setup>
import { computed, useAttrs } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    nativeType?: 'button' | 'submit' | 'reset'
  }>(),
  {
    nativeType: 'button',
  },
)

const attrs = useAttrs()

const passthroughAttrs = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { type: _type, ...rest } = attrs
  return rest
})

const soundOn = () => {
  const audio = new Audio('/button.click.ogg')
  audio.volume = 0.3
  audio.play().catch(() => {})
}
</script>

<template>
  <button
    v-bind="passthroughAttrs"
    :type="props.nativeType"
    class="minecraft-button-classic"
    @click="soundOn"
  >
    <span class="title">
      <slot></slot>
    </span>
  </button>
</template>

<style lang="css" scoped>
.minecraft-button-classic {
  padding: 0;
  height: 3rem;
  width: 100%;
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
  background: #999 url('/background/bgbtn.jpg') center/cover;
  image-rendering: pixelated;
  border: 2px solid #000;
  font: inherit;
  color: inherit;
}

.minecraft-button-classic:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.minecraft-button-classic:focus-visible .title {
  background-color: rgba(100, 100, 255, 0.45);
  text-shadow: 2px 2px #202013cc;
  color: #ffffa0;
  outline: 3px solid #fff;
  outline-offset: 3px;
}

.minecraft-button-classic[activated='true'] .title {
  background-color: rgba(100, 100, 255, 0.45);
  text-shadow: 2px 2px #202013cc;
  color: #ffffa0;
  box-shadow:
    inset -2px -4px #0004,
    inset 2px 2px #fff5;
}

.minecraft-button-classic:hover .title {
  background-color: rgba(100, 100, 255, 0.45);
  text-shadow: 2px 2px #202013cc;
  color: #ffffa0;
}

.minecraft-button-classic:active .title {
  box-shadow:
    inset -2px -4px #0004,
    inset 2px 2px #fff5;
}

.title {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 100%;
  height: 100%;
  padding-bottom: 0.3em;

  color: #ddd;
  text-shadow: 2px 2px #000a;
  box-shadow:
    inset -2px -4px #0006,
    inset 2px 2px #fff7;
}
</style>
