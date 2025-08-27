<script lang="ts" setup>
import type { IntroEntity } from '@/api/introlist'

const props = defineProps({
  intro: {
    type: Object as () => IntroEntity,
    required: true,
  },
  right: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div class="intro-box">
    <div v-if="props.intro.image == ''" class="intro-center">
      <div class="intro-text">
        <p>{{ props.intro.title }}</p>
        <span>{{ props.intro.description }}</span>
      </div>
    </div>
    <div v-else :class="!right ? 'intro-right' : 'intro-left'">
      <img :src="`/${props.intro.image}`" alt="image" class="intro-image" />
      <div class="intro-text">
        <p>{{ props.intro.title }}</p>
        <span>{{ props.intro.description }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
.intro-box {
  width: 100%;
  margin-top: 1rem;
  margin-bottom: 3rem;
}

.intro-right {
  display: flex;
  flex-direction: row-reverse;
  flex-wrap: wrap;
  justify-content: space-around;
}

.intro-left {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-around;
}

.intro-center {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  border-top: 2px dashed gray;
}

.intro-text {
  max-width: 30rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  opacity: 0;
  animation: fade-in-down 1s ease-out 0.5s forwards;
}

.intro-left .intro-text {
  text-align: left;
  opacity: 0;
  animation: fade-in-right 1s ease-out 1s forwards;
}

.intro-right .intro-text {
  text-align: right;
  opacity: 0;
  animation: fade-in-left 1s ease-out 1s forwards;
}

.intro-text p {
  font-size: 1.5rem;
  font-weight: bold;
  margin-top: 0;
  margin-bottom: 0.5rem;
}

.intro-center .intro-text p {
  font-size: 2rem;
  margin-bottom: 1rem;
  margin-top: 3rem;
}

.intro-image {
  max-height: 20rem;
  box-shadow: 4px 4px rgba(0, 0, 0, 0.7);
}

.intro-left .intro-image {
  opacity: 0;
  animation: fade-in-left 1s ease-out 1s forwards;
}

.intro-right .intro-image {
  opacity: 0;
  animation: fade-in-right 1s ease-out 1s forwards;
}
</style>
