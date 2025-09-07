<script lang="ts" setup>
const soundOn = () => {
  const audio = new Audio('/button.click.ogg')
  audio.play()
  audio.volume = 0.3
}
</script>

<template>
  <div class="minecraft-button" :onclick="soundOn">
    <slot></slot>
  </div>
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
