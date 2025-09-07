<script lang="ts" setup>
const model = defineModel<boolean>({
  default: false,
})
const emits = defineEmits(['on', 'off'])

const soundOn = () => {
  const audio = new Audio('/button.click.ogg')
  audio.play()
  audio.volume = 0.3
}

const flick = () => {
  if (model.value) {
    emits('off')
  } else {
    emits('on')
  }
  model.value = !model.value
}
</script>

<template>
  <input class="minecraft-switch" type="checkbox" :checked="model" @click="(flick(), soundOn())" />
</template>

<style lang="css" scoped>
.minecraft-switch {
  appearance: none;
  color: transparent;
  width: 60px;
  height: 32px;
  background-image: url('/UI/toggle_off.png');
}

.minecraft-switch:hover {
  appearance: none;
  color: transparent;
  width: 60px;
  height: 32px;
  background-image: url('/UI/toggle_off_hover.png');
}

.minecraft-switch:checked {
  background-image: url('/UI/toggle_on.png');
}

.minecraft-switch:checked:hover {
  background-image: url('/UI/toggle_on_hover.png');
}

.minecraft-switch[new=''] {
  appearance: none;
  color: transparent;
  width: 60px;
  height: 32px;
  background-image: url('/UI/toggle_off_new.png');
}

.minecraft-switch[new='']:checked {
  background-image: url('/UI/toggle_on_new.png');
}
</style>
