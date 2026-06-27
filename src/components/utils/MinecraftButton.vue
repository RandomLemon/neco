<script lang="ts" setup>
import { computed, useAttrs } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    dark?: boolean
    nativeType?: 'button' | 'submit' | 'reset'
  }>(),
  {
    dark: false,
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
    :class="props.dark ? 'minecraft-button dark' : 'minecraft-button'"
    @click="soundOn"
  >
    <slot></slot>
  </button>
</template>

<style lang="css" scoped>
.minecraft-button {
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
  padding: 1rem;
  outline: 2px solid #000;
  border: 2px solid;
  background-color: #c6c6c6;
  border-image: url('/UI/button_normal.png') 1;
  cursor: pointer;
  font: inherit;
}

.minecraft-button.dark {
  color: #fff;
  outline: 2px solid #333;
  background-color: #303030;
  border-image: url('/UI/button_normal.png') 1;
}

.minecraft-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.minecraft-button:focus-visible {
  color: #fff;
  outline: 3px solid #fff;
  outline-offset: 3px;
  background-color: #43a01c;
  border-image: url('/UI/button_hover.png') 1;
}

.minecraft-button:hover {
  color: #fff;
  outline: 2px solid #fff;
  background-color: #43a01c;
  border-image: url('/UI/button_hover.png') 1;
}

.minecraft-button:active {
  background-color: #8b8b8b;
  border-image: url('/UI/button_pressed_hover.png') 1;
}

.minecraft-button:active:hover {
  color: #fff;
  outline: 2px solid #fff;
  background-color: #43a01c;
  border-image: url('/UI/button_pressed.png') 1;
}
</style>
