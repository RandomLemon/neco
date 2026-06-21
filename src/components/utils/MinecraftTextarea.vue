<script lang="ts" setup>
const model = defineModel<string>({
  default: '',
})

const autoResize = (event: Event) => {
  const textarea = event.target as HTMLTextAreaElement
  textarea.style.height = ''
  textarea.style.height = `calc(0.2rem + ${textarea.scrollHeight}px)`
}
</script>

<template>
  <textarea
    class="minecraft-input"
    v-bind="$attrs"
    type="text"
    v-model="model"
    @input="autoResize"
  ></textarea>
</template>

<style lang="css" scoped>
.minecraft-input {
  font-size: 1rem;
  letter-spacing: 1px;
  padding: 0.2rem;
  border: 2px solid;
  background-color: #616161;
  color: #fff;
  outline: 2px solid black;
  border-image: url('/UI/text-input.png') 1;
  overflow-y: hidden;
}

.minecraft-input:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 3px;
}
</style>
