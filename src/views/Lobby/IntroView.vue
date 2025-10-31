<script lang="ts" setup>
import { GetIntroList, type IntroEntity } from '@/api/introlist'
import { onMounted, ref } from 'vue'
import IntroItem from '@/components/IntroItem.vue'

const intros = ref<IntroEntity[]>([])

onMounted(() => {
  intros.value = GetIntroList()
})
</script>

<template>
  <div class="intro-area">
    <IntroItem
      v-for="(intro, index) in intros"
      :key="index"
      :intro="intro"
      :right="index % 2 == 1"
    />
  </div>
</template>

<style lang="css" scoped>
.intro-area {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-top: 2rem;

  box-sizing: content-box;
}
</style>
