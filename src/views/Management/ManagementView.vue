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
    toast.warning('您尚未登录！')
    router.replace('/auth/login')
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <div class="management-area">
    <div class="management-menu" :type="sidebarExpand ? '' : 'shrink'">
      <img class="management-logo" src="/nmo-logo-large.png" />
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
      :type="sidebarExpand ? '' : 'expand'"
      @click="sidebarExpand = !sidebarExpand"
    >
      <text>▶</text>
    </MinecraftButton>
    <div class="management-tab-container" :type="sidebarExpand ? '' : 'expand'">
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

.management-menu[type='shrink'] {
  padding-left: 0;
  padding-right: 0;
  width: 0;
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

.management-tab-container[type='expand'] {
  width: 100vw;
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

.management-shrink-btn[type='expand'] {
  left: 0;
}

.management-shrink-btn text {
  font-size: 1.5rem;
  transition: transform 0.3s ease-in-out;
  transform: rotate(180deg) translateX(10%);
}

.management-shrink-btn[type='expand'] text {
  transform: none;
}
</style>

<style lang="css">
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
</style>
