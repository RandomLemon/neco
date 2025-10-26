<script lang="ts" setup>
import MinecraftButtonClassic from '@/components/utils/MinecraftButtonClassic.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const userGroup = localStorage.getItem('userGroup')
</script>

<template>
  <div class="management-tab-title-container">
    <text class="management-tab-title">文档管理</text>
    <text class="management-tab-subtitle">你根本就不强</text>
  </div>
  <MinecraftButtonClassic
    v-if="userGroup?.includes('admin') || userGroup?.includes('document_admin')"
    @click="router.push('/documents_editor')"
  >
    前往文档编辑器
  </MinecraftButtonClassic>
</template>
