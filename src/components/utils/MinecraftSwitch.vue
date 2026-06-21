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

const onChange = (event: Event) => {
  const checked = (event.target as HTMLInputElement).checked
  model.value = checked

  if (checked) {
    emits('on')
  } else {
    emits('off')
  }

  soundOn()
}
</script>

<template>
  <input
    class="minecraft-switch"
    v-bind="$attrs"
    type="checkbox"
    :checked="model"
    @change="onChange"
  />
</template>

<style lang="css" scoped>
.minecraft-switch {
  cursor: pointer;
  appearance: none;
  color: transparent;
  width: 60px;
  height: 32px;
  background-image: url('/UI/toggle_off.png');
}

.minecraft-switch:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 3px;
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
