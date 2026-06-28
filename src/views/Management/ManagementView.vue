<script lang="ts" setup>
import { CheckAuthorized, Logout } from '@/api/auth'
import MinecraftButton from '@/components/utils/MinecraftButton.vue'
import MinecraftButtonClassic from '@/components/utils/MinecraftButtonClassic.vue'
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'

const toast = useToast()
const router = useRouter()
const route = useRoute()
const sidebarExpand = ref(true)

const onLogout = () => {
  Logout()
  toast.success('登出成功！')
  router.replace('/auth/login')
}

const onResize = () => {
  if (window.innerWidth < 768) {
    sidebarExpand.value = false
  } else {
    sidebarExpand.value = true
  }
}

onMounted(async () => {
  if (window.innerWidth < 768) {
    sidebarExpand.value = false
  }
  window.addEventListener('resize', onResize)

  const result = await CheckAuthorized()
  if (!result) {
    toast.warning('您尚未登录或登录状态已过期！')
    router.replace('/auth/login')
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div class="management-area">
    <div
      id="management-menu"
      class="management-menu"
      :data-state="sidebarExpand ? 'expanded' : 'collapsed'"
      :inert="!sidebarExpand || undefined"
      :aria-hidden="!sidebarExpand"
    >
      <img class="management-logo" src="/nmo-logo-large.png" alt="" />
      <span class="management-title">NMO - 管理后台</span>
      <MinecraftButtonClassic
        class="management-nav"
        :activated="route.path.endsWith('/management/user')"
        @click="router.replace('/management/user')"
        >用户管理</MinecraftButtonClassic
      >
      <MinecraftButtonClassic
        class="management-nav"
        :activated="route.path.endsWith('/management/club')"
        @click="router.replace('/management/club')"
        >社团管理</MinecraftButtonClassic
      >
      <MinecraftButtonClassic
        class="management-nav"
        :activated="route.path.endsWith('/management/server')"
        @click="router.replace('/management/server')"
        >服务器信息</MinecraftButtonClassic
      >
      <MinecraftButtonClassic
        class="management-nav"
        :activated="route.path.endsWith('/management/news')"
        @click="router.replace('/management/news')"
        >文章管理</MinecraftButtonClassic
      >
      <MinecraftButtonClassic
        class="management-nav"
        :activated="route.path.endsWith('/management/document')"
        @click="router.replace('/management/document')"
        >文档管理</MinecraftButtonClassic
      >

      <MinecraftButtonClassic
        class="management-nav"
        :activated="route.path.endsWith('/management/bot')"
        @click="router.replace('/management/bot')"
        >机器人连接</MinecraftButtonClassic
      >

      <div style="display: flex; flex-direction: column; margin-top: auto">
        <MinecraftButtonClassic class="management-nav" @click="router.push('/')"
          >回到主页</MinecraftButtonClassic
        >
        <MinecraftButtonClassic class="management-nav" @click="onLogout"
          >登出</MinecraftButtonClassic
        >
      </div>
    </div>
    <MinecraftButton
      class="management-shrink-btn"
      :data-state="sidebarExpand ? 'expanded' : 'collapsed'"
      :aria-expanded="sidebarExpand"
      aria-controls="management-menu"
      :aria-label="sidebarExpand ? '收起后台导航' : '展开后台导航'"
      @click="sidebarExpand = !sidebarExpand"
    >
      <span aria-hidden="true">▶</span>
    </MinecraftButton>
    <div class="management-tab-container" :data-state="sidebarExpand ? 'normal' : 'expanded'">
      <RouterView />
    </div>
  </div>
</template>

<style lang="css" scoped>
.management-area {
  width: min-content;
  min-width: 100%;
  height: 100vh;
  display: flex;
  position: relative;
}

.management-menu {
  display: flex;
  flex-direction: column;
  width: 16rem;
  padding: 2rem 1rem;
  border-right: 1px solid var(--minecraft-gray-light);
  transition: all 0.3s ease-in-out;
  overflow: hidden;
}

.management-logo {
  margin: 0 auto;
  width: 70%;
  height: auto;
}

.management-title {
  user-select: none;
  font-size: 1.5rem;
  color: white;
  margin: 1rem auto;
  text-wrap: nowrap;
}

.management-nav {
  margin-top: 0.5rem;
  font-size: 1.2rem;
}

.management-tab-container {
  display: flex;
  flex-direction: column;
  padding: 2rem;
  max-height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
  width: calc(100vw - 16rem);
  min-width: 375px;
  transition: all 0.3s ease-in-out;
  gap: 1rem;
}

.management-shrink-btn {
  padding: 0 !important;
  height: 4rem;
  width: 1.2rem;
  position: absolute;
  left: 16rem;
  top: calc(50vh - 2rem);
  transition: left 0.3s ease-in-out;
}

.management-menu[data-state='collapsed'] {
  padding-left: 0;
  padding-right: 0;
  width: 0;
}

.management-tab-container[data-state='expanded'] {
  width: 100vw;
}

.management-shrink-btn[data-state='collapsed'] {
  left: 0;
}

.management-shrink-btn span {
  transition: transform 0.3s ease-in-out;
  transform: rotate(180deg) translateX(10%);
}

.management-shrink-btn[data-state='collapsed'] span {
  transform: none;
}
</style>

<style lang="css">
.management-tab-title {
  margin-top: 0;
  margin-bottom: 0;
}

.management-tab-form-title {
  margin-top: 0;
  margin-bottom: 0;
}

.management-tab-title-container {
  display: flex;
  align-items: flex-end;
  width: 100%;
  border-bottom: 1px solid var(--minecraft-gray-light);
  padding-bottom: 1rem;
}

.management-tab-title {
  color: white;
  user-select: none;
  font-size: 1.5rem;
  margin-right: 1rem;
}

.management-tab-subtitle {
  user-select: none;
}

.management-tab-form {
  display: flex;
  padding: 1rem;
}

.management-tab-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  gap: 1rem;

  background-color: #4a4a4a;
  border: 4px solid #222222;
  box-shadow:
    inset -4px -4px 0px 0px #3a3a3a,
    inset 4px 4px 0px 0px #6b6b6b;
}

.management-tab-form-title {
  color: white;
  font-size: 1.5rem;
  user-select: none;
  font-weight: bold;
}

.management-tab-form-subtitle {
  margin-left: 1rem;
  user-select: none;
  align-self: flex-end;
}

.management-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background-color: #4a4a4a;
  border: 4px solid #222222;
  box-shadow:
    inset -4px -4px 0px 0px #3a3a3a,
    inset 4px 4px 0px 0px #6b6b6b;
  box-sizing: border-box;
}

.management-section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--minecraft-gray-light);
}

.management-section-title-block {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.management-section-title {
  margin: 0;
  color: #fff;
  font-size: 1.35rem;
  line-height: 1.45rem;
  user-select: none;
}

.management-section-desc {
  margin: 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.9rem;
  line-height: 1.25rem;
  user-select: none;
}

.management-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.management-card {
  padding: 1rem;
  background-color: #303030;
  border: 2px solid #1a1a1a;
  box-shadow:
    inset -2px -2px 0 0 #1f1f1f,
    inset 2px 2px 0 0 #454545;
}

.management-card-title {
  margin: 0 0 0.75rem 0;
  color: #fff;
  font-size: 1.15rem;
  line-height: 1.25rem;
  user-select: none;
}

.management-grid-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: 1rem;
}

.management-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
}

.management-field.full {
  grid-column: 1 / -1;
}

.management-field-label {
  color: #fff;
  font-size: 1rem;
  user-select: none;
}

.management-field-help {
  margin: 0;
  color: rgba(255, 255, 255, 0.66);
  font-size: 0.85rem;
  line-height: 1.25rem;
}

.management-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem 1rem;
  color: rgba(255, 255, 255, 0.72);
  text-align: center;
  background-color: rgba(0, 0, 0, 0.18);
  border: 2px dashed #666;
}

.management-empty-state strong {
  color: #fff;
  font-size: 1.1rem;
}

.management-action-row {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid #555;
}

.management-danger-text {
  margin: 0;
  color: #f0c36a;
  line-height: 1.35rem;
}

@media screen and (max-width: 768px) {
  .management-section-header,
  .management-toolbar,
  .management-action-row {
    align-items: stretch;
    flex-direction: column;
  }

  .management-toolbar > *,
  .management-action-row > * {
    width: 100%;
  }
}
</style>
