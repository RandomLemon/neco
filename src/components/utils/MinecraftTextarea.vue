<script lang="ts" setup>
const model = defineModel<string>({
  default: '',
})
</script>

<template>
  <textarea
    class="minecraft-input"
    type="text"
    v-model="model"
    oninput="this.style.height = ''; this.style.height = `calc(0.2rem + ${this.scrollHeight}px)`"
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
</style>
