<script lang="ts" setup>
import { Login } from '@/api/auth'
import MinecraftButtonClassic from '@/components/utils/MinecraftButtonClassic.vue'
import MinecraftInput from '@/components/utils/MinecraftInput.vue'
import { onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'

const router = useRouter()
const toast = useToast()

const form = reactive({
  username: '',
  password: '',
})

const backHome = () => {
  router.push('/')
}

const onLogin = async () => {
  const result = await Login(form.username, form.password)
  if (result == null || result?.error) {
    toast.error(`登录失败：${result?.error || '未知错误'}`)
  } else {
    toast.success('登录成功！')
    router.replace('/management/user')
  }
}

const bgCount = 62
let box: HTMLElement | null = null
const pool: Array<string> = []
const stayTime = 8000
const fadeTime = 400
const unloadedImages: Array<string> = []

const preloadImage = async (url: string) => {
  if (unloadedImages.includes(url)) {
    unloadedImages.splice(unloadedImages.indexOf(url), 1)
  } else {
    return
  }
  const promise = new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = resolve
    img.onerror = reject
    img.src = url
  })
  await promise
}

const nextBg = (first: boolean = false) => {
  if (box == null) {
    return
  }
  if (pool.length === 0) {
    for (let i = 1; i <= bgCount; i++) {
      pool.push(import.meta.env.BASE_URL + `mc自然风景背景图-air/${i}.jpg`)
    }
  }

  const idx = Math.floor(Math.random() * pool.length)
  const url = pool.splice(idx, 1)[0]
  preloadImage(url)

  box.style.opacity = '0'
  if (first) {
    box.style.backgroundImage = `url(${url})`
    box.style.opacity = '1'
  }
  setTimeout(() => {
    if (box == null) {
      return
    }
    box.style.backgroundImage = `url(${url})`
    box.style.opacity = '1'

    setTimeout(nextBg, stayTime + fadeTime)
  }, fadeTime)
}

onMounted(() => {
  // 背景轮播
  box = document.getElementById('login-bg')
  for (let i = 1; i <= bgCount; i++) {
    unloadedImages.push(import.meta.env.BASE_URL + `mc自然风景背景图-air/${i}.jpg`)
  }
  nextBg(true)
})
</script>

<template>
  <div id="login-bg"></div>
  <div class="login-area">
    <form class="login-panel mc-border" @submit.prevent="onLogin">
      <img class="login-logo" src="/nmo-logo-large.png" />
      <h1 class="login-title">登录 NMO Ecosystem</h1>
      <label class="login-label" for="login-username">用户名</label>
      <MinecraftInput
        id="login-username"
        class="login-input"
        v-model="form.username"
        placeholder="用户名"
        autocomplete="username"
      />
      <label class="login-label" for="login-password">密码</label>
      <MinecraftInput
        id="login-password"
        class="login-input"
        v-model="form.password"
        type="password"
        autocomplete="current-password"
        placeholder="密码"
      />
      <div class="button-area">
        <MinecraftButtonClassic class="login-btn" @click="backHome"
          >回到主页</MinecraftButtonClassic
        >
        <MinecraftButtonClassic class="login-btn" native-type="submit">
          登录
        </MinecraftButtonClassic>
      </div>
    </form>
  </div>
</template>

<style lang="css" scoped>
.login-label {
  width: 80%;
  font-size: 1rem;
  margin-top: 0.75rem;
  user-select: none;
}

.login-area {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

#login-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;

  background-size: cover;
  background-position: center;
  transition: opacity 0.4s ease-in-out;
}

.login-panel {
  background-color: color-mix(in srgb, rgba(255, 255, 255, 0.8), rgba(0, 0, 0, 0.8) 80%);
  min-width: 20rem;
  width: 45%;
  height: 60vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.login-logo {
  width: 10rem;
}

.login-input {
  width: 80%;
  font-size: 1.2rem;
  margin: 0.5rem;
  padding: 0.5rem 0.5rem;
}

.login-title {
  user-select: none;
  font-size: 1.5rem;
  margin: 1rem 0;
}

.login-area input {
  margin-top: 0.5rem;
}

.button-area {
  width: 80%;
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.login-btn {
  font-size: 1.2rem;
  width: 8rem;
}
</style>
