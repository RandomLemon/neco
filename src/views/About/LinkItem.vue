<script lang="ts" setup>
import type { LinkEntity } from '../../api/linklist'

const props = defineProps({
  link: {
    type: Object as () => LinkEntity,
    required: true,
  },
})
</script>

<template>
  <a
    class="link-card"
    :href="props.link.url"
    target="_blank"
    rel="noopener noreferrer"
    :style="{ backgroundImage: `url(${props.link.image})` }"
  >
    <div class="link-content">
      <p>{{ link.name }}</p>
      <span>{{ link.description }}</span>
    </div>
  </a>
</template>

<style lang="css" scoped>
.link-card:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 4px;
}

.link-card {
  color: inherit;
  text-decoration: none;
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

  background-position: center;
  background-size: cover;

  box-shadow: 4px 4px rgba(0, 0, 0, 0.5);
  cursor: pointer;
}

.link-content {
  margin-top: auto;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  padding-left: 1rem;
  padding-right: 1rem;

  background-color: rgba(0, 0, 0, 0.7);
  user-select: none;
}

.link-content p {
  font-size: 1.2rem;
  font-weight: bold;
  margin: 0;
}
</style>
