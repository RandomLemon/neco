<script lang="ts" setup>
import { Login } from '@/api/auth'
import MinecraftButtonClassic from '@/components/utils/MinecraftButtonClassic.vue'
import MinecraftInput from '@/components/utils/MinecraftInput.vue'
import { onMounted, reactive } from 'vue'
import { useToast } from 'vue-toastification'

const toast = useToast()

const form = reactive({
  username: '',
  password: '',
})

const onLogin = async () => {
  const result = await Login(form.username, form.password)
  if (result == null || result.error) {
    toast.error(`登录失败：${result?.error || '未知错误'}`)
  } else {
    toast.success('登录成功！')
  }
}

const bgCount = 62
let box: HTMLElement | null = null
const pool: Array<string> = []
const stayTime = 8000
const fadeTime = 400

const nextBg = (first: boolean = false) => {
  if (box == null) {
    return
  }
  if (pool.length === 0) {
    for (let i = 1; i <= bgCount; i++) {
      pool.push(`/mc自然风景背景图-air/${i}.png`)
    }
  }

  const idx = Math.floor(Math.random() * pool.length)
  const url = pool.splice(idx, 1)[0]

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
  nextBg(true)
})
</script>

<template>
  <div id="login-bg"></div>
  <div class="login-area">
    <div class="login-panel mc-border">
      <img class="login-logo" src="/nmo-logo-large.png" />
      <span class="login-title">登录 NMO Ecosystem</span>
      <MinecraftInput class="login-input" v-model="form.username" placeholder="用户名" />
      <MinecraftInput class="login-input" v-model="form.password" placeholder="密码" />
      <div class="button-area">
        <MinecraftButtonClassic class="login-btn" @click="onLogin">登录</MinecraftButtonClassic>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
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
}

.login-btn {
  font-size: 1.2rem;
  width: 8rem;
}
</style>
