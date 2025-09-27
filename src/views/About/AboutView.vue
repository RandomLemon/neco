<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { GetLinkList, type LinkEntity } from '@/api/linklist'
import LinkItem from './LinkItem.vue'
import { GetDetailedIntroList, type IntroEntity } from '@/api/introlist'
import IntroItem from '@/components/IntroItem.vue'

const linkList = ref<LinkEntity[]>([])
const intros = ref<IntroEntity[]>([])
onMounted(() => {
  linkList.value = GetLinkList()
  intros.value = GetDetailedIntroList()
})
</script>

<template>
  <div class="main-area">
    <div class="links-area">
      <LinkItem
        class="intro-item"
        v-for="item in linkList"
        :style="{
          '--delay': `${linkList.indexOf(item) * 0.2}s`,
        }"
        :key="item.name"
        :link="item"
      />
    </div>
    <div class="intro-area">
      <h1 style="opacity: 0; animation: fade-in-down 1s ease-out forwards">
        更多关于我们的事情...
      </h1>
      <IntroItem
        v-for="(intro, index) in intros"
        :key="index"
        :intro="intro"
        :right="index % 2 == 1"
      />
    </div>
  </div>
</template>

<style lang="css" scoped>
.links-area {
  padding-top: 5rem;
  padding-bottom: 5rem;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-start;
  background-image: url('/background/links-background.jpg');
  background-size: cover;
  background-position: center;

  position: relative;
}

.links-area::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 5rem;
  background: linear-gradient(to bottom, transparent 0%, var(--background-color) 100%);
}

.intro-area {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-top: 2rem;

  box-sizing: content-box;
}

.intro-item {
  opacity: 0;
  animation: fade-in-down 0.5s ease-in-out forwards;
  animation-delay: var(--delay);
}
</style>
