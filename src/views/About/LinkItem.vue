<script lang="ts" setup>
import type { LinkEntity } from '../../api/linklist'

const props = defineProps({
  link: {
    type: Object as () => LinkEntity,
    required: true,
  },
})

const jumpto = (url: string) => {
  window.open(url, '_blank')
}
</script>

<template>
  <div
    class="link-card"
    :style="{ backgroundImage: `url(${props.link.image})` }"
    @click="jumpto(props.link.url)"
  >
    <div class="link-content">
      <p>{{ link.name }}</p>
      <span>{{ link.description }}</span>
    </div>
  </div>
</template>

<style lang="css" scoped>
.link-card {
  margin: 1rem;
  width: 15rem;
  height: 15rem;
  border-top: 2px solid var(--minecraft-green-light);
  border-left: 2px solid var(--minecraft-green);
  border-right: 2px solid var(--minecraft-green);
  border-bottom: 2px solid var(--minecraft-green-dark);
  display: flex;
  flex-direction: column;
  position: relative;

  box-shadow: 4px 4px rgba(0, 0, 0, 0.5);
  cursor: pointer;
}

.link-content {
  margin-top: auto;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  padding-left: 1rem;
  padding-right: 1rem;

  background-color: rgba(0, 0, 0, 0.3);
  user-select: none;
}

.link-content p {
  font-size: 1.2rem;
  font-weight: bold;
  margin: 0;
}
</style>
