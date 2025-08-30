<script lang="ts" setup>
import {
  GetAvatar,
  GetUserList,
  UpdateAvatar,
  UpdatePassword,
  UpdateUserInfo,
  type UserEntity,
} from '@/api/auth'
import MinecraftButtonClassic from '@/components/utils/MinecraftButtonClassic.vue'
import MinecraftInput from '@/components/utils/MinecraftInput.vue'
import { onMounted, ref, computed } from 'vue'
import { useToast } from 'vue-toastification'

const toBase64 = async (image: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const base64str = reader.result as string
      resolve(base64str)
    }

    reader.onerror = reject

    reader.readAsDataURL(image)
  })
}

const triggerUploadBase64 = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.click()

    input.onchange = async () => {
      const image = input.files?.[0]
      if (!image) return reject(new Error('No image selected'))

      try {
        const base64str = await toBase64(image)
        resolve(base64str)
      } catch (error) {
        reject(error)
      }
    }
  })
}

const toast = useToast()

const avatar = ref('/nmo-logo-large.png')
let username = localStorage.getItem('username') || 'KingcqKingcqKingcq'
let userGroup = JSON.parse(localStorage.getItem('userGroup') || '["admin"]')
let userDepartment = JSON.parse(localStorage.getItem('userDepartment') || '["START DASH"]')
let userTags = JSON.parse(
  localStorage.getItem('userTags') ||
    `[
    {
      "text": "管理员",
      "color": "#E6A23C",
      "tagColor": "rgba(230, 162, 60, 0.1)"
    }
  ]`,
)

const updateLocalStorage = () => {
  username = localStorage.getItem('username') || 'Kingcq'
  userGroup = JSON.parse(localStorage.getItem('userGroup') || '["admin"]')
  userDepartment = JSON.parse(localStorage.getItem('userDepartment') || '["START DASH"]')
  userTags = JSON.parse(
    localStorage.getItem('userTags') ||
      `[
      {
        "text": "管理员",
        "color": "#E6A23C",
        "tagColor": "rgba(230, 162, 60, 0.1)"
      }
    ]`,
  )
}

const usernameInput = ref(username)
const oldPasswordInput = ref('')
const newPasswordInput = ref('')
const repeatPasswordInput = ref('')

const resetChangeUsername = () => {
  usernameInput.value = username
}

const resetChangePassword = () => {
  oldPasswordInput.value = ''
  newPasswordInput.value = ''
  repeatPasswordInput.value = ''
}

const onChangeUsername = async () => {
  if (usernameInput.value.trim() === '') {
    toast.error('用户名不能为空！')
    return
  }
  const result = await UpdateUserInfo(usernameInput.value, userGroup, userDepartment, userTags)
  if (!result) {
    toast.success('修改成功！')
    updateLocalStorage()
  } else {
    toast.error(`修改失败：${result}！`)
  }
}

const onChangePassword = async () => {
  if (oldPasswordInput.value.trim() === '') {
    toast.error('旧密码不能为空！')
    return
  }
  if (newPasswordInput.value.trim() === '') {
    toast.error('新密码不能为空！')
    return
  }
  if (repeatPasswordInput.value.trim() === '') {
    toast.error('重复密码不能为空！')
    return
  }
  if (newPasswordInput.value !== repeatPasswordInput.value) {
    toast.error('两次输入的密码不一致！')
    return
  }
  const result = await UpdatePassword(username, oldPasswordInput.value, newPasswordInput.value)
  if (!result) {
    toast.success('修改成功！')
    resetChangePassword()
  } else {
    toast.error(`修改失败：${result}！`)
  }
}

// const onChangeAvatar = async () => {
//   try {
//     const base64str = await triggerUploadBase64()
//     const result = await UpdateAvatar(username, base64str)
//     if (result) {
//       toast.error('上传头像失败！')
//       return
//     }
//   } catch (e) {
//     toast.error(`上传文件失败：${e}！`)
//     return
//   }
//   const result = await GetAvatar(username)
//   if (!result) {
//     toast.warning('获取头像失败！')
//     return
//   }
//   avatar.value = result
// }

const users = ref<Array<UserEntity> | null>([])
const searchKeyword = ref('')

const filteredUsers = computed(() => {
  if (!users.value) return []
  return users.value.filter((user) =>
    user.username.toLowerCase().includes(searchKeyword.value.toLowerCase()),
  )
})

onMounted(async () => {
  if (userGroup.includes('admin')) {
    users.value = (await GetUserList()) || [
      {
        username: 'Kingcq',
        group: ['admin'],
        department: ['START DASH'],
        tags: [
          {
            text: '管理员',
            color: '#E6A23C',
            tagColor: 'rgba(230, 162, 60, 0.1)',
          },
        ],
      } as UserEntity,
      {
        username: 'StrideBeach',
        group: ['news_admin'],
        department: ['动画组'],
        tags: [
          {
            text: '碎碎',
            color: '#409EFF',
            tagColor: 'rgba(33, 61, 91, 0.2)',
          },
        ],
      } as UserEntity,
      {
        username: 'AintCecily',
        group: ['activity_admin'],
        department: ['动画组'],
        tags: [
          {
            text: '壳壳',
            color: '#F56C6C',
            tagColor: 'rgba(88, 46, 46, 0.2)',
          },
        ],
      } as UserEntity,
      {
        username: 'AircraftCarrierX',
        group: ['activity_admin', 'news_admin'],
        department: ['START_DASH'],
        tags: [
          {
            text: '吉祥物',
            color: '#FF00FF',
            tagColor: 'rgba(186, 85, 211, 0.2)',
          },
        ],
      } as UserEntity,
    ] // TODO: To be removed
    if (!users.value) {
      toast.warning('获取用户列表失败！')
    }
  }
  avatar.value = (await GetAvatar(username)) || '/nmo-logo-large.png'
  if (avatar.value.trim() === '') {
    avatar.value = '/nmo-logo-large.png'
  }
})
</script>

<template>
  <div class="management-tab-title-container">
    <text class="management-tab-title">用户管理</text>
  </div>
  <form class="management-tab-form">
    <text class="management-tab-form-title">当前用户信息</text>
    <div class="user-info-container">
      <img class="avatar-img" :src="avatar" alt="用户头像" />
      <div class="user-info">
        <div class="user-info-span">
          <text class="user-info-text">{{ username }}</text>
          <div
            class="user-info-tag"
            v-for="tag in userTags"
            :key="tag.text"
            :style="{
              color: tag.color,
              backgroundColor: tag.tagColor,
            }"
          >
            {{ tag.text }}
          </div>
        </div>
        <div class="user-info-span" v-if="userGroup.length > 0">
          <text class="user-info-label">权限：</text>
          <div class="user-info-group">
            <text class="user-info-group-item" v-for="group in userGroup" :key="group">{{
              group === 'admin' ? '超级管理' : group === 'activity_admin' ? '活动管理' : '新闻管理'
            }}</text>
          </div>
        </div>
        <div class="user-info-span">
          <text class="user-info-label">部门：</text>
          <div class="user-info-group">
            <text
              class="user-info-group-item"
              v-for="department in userDepartment"
              :key="department"
              >{{ department }}</text
            >
          </div>
        </div>
      </div>
    </div>
  </form>
  <form class="management-tab-form">
    <text class="management-tab-form-title">修改用户名</text>
    <div class="user-input">
      <text class="user-input-label">用户名</text>
      <MinecraftInput class="user-input-field" placeholder="输入用户名" v-model="usernameInput" />
    </div>
    <div class="form-btn-group">
      <MinecraftButtonClassic class="user-input-button" @click="resetChangeUsername"
        >重置</MinecraftButtonClassic
      >
      <MinecraftButtonClassic class="user-input-button" @click="onChangeUsername"
        >保存</MinecraftButtonClassic
      >
    </div>
  </form>
  <form class="management-tab-form">
    <text class="management-tab-form-title">修改密码</text>
    <div class="user-input">
      <text class="user-input-label">旧密码</text>
      <MinecraftInput
        class="user-input-field"
        placeholder="输入旧密码"
        type="password"
        v-model="oldPasswordInput"
      />
    </div>
    <div class="user-input">
      <text class="user-input-label">新密码</text>
      <MinecraftInput
        class="user-input-field"
        placeholder="输入新密码"
        type="password"
        v-model="newPasswordInput"
      />
    </div>
    <div class="user-input">
      <text class="user-input-label">重复密码</text>
      <MinecraftInput
        class="user-input-field"
        placeholder="输入重复密码"
        type="password"
        v-model="repeatPasswordInput"
      />
    </div>
    <div class="form-btn-group">
      <MinecraftButtonClassic class="user-input-button" @click="resetChangePassword"
        >重置</MinecraftButtonClassic
      >
      <MinecraftButtonClassic class="user-input-button" @click="onChangePassword"
        >保存</MinecraftButtonClassic
      >
    </div>
  </form>
  <form class="management-tab-form" v-if="userGroup.includes('admin')">
    <div style="display: flex">
      <text class="management-tab-form-title">账户管理</text>
      <text class="management-tab-form-subtitle">点击以编辑！</text>
    </div>
    <MinecraftInput
      class="user-input-field"
      placeholder="查找用户"
      v-model="searchKeyword"
      style="margin-left: 2px"
    />
    <div class="user-card-container">
      <div class="user-card" v-for="user in filteredUsers" :key="user.username">
        <img class="avatar-img" style="width: 4rem; height: 4rem" :src="avatar" alt="用户头像" />
        <div class="user-info">
          <div class="user-info-span">
            <text class="user-info-text">{{ user.username }}</text>
            <div
              class="user-info-tag"
              v-for="tag in user.tags"
              :key="tag.text"
              :style="{
                color: tag.color,
                backgroundColor: tag.tagColor,
              }"
            >
              {{ tag.text }}
            </div>
          </div>
          <div class="user-info-span" v-if="user.group.length > 0">
            <text class="user-info-label">权限：</text>
            <div class="user-info-group">
              <text class="user-info-group-item" v-for="group in user.group" :key="group">{{
                group === 'admin'
                  ? '超级管理'
                  : group === 'activity_admin'
                    ? '活动管理'
                    : '新闻管理'
              }}</text>
            </div>
          </div>
          <div class="user-info-span">
            <text class="user-info-label">部门：</text>
            <div class="user-info-group">
              <text
                class="user-info-group-item"
                v-for="department in user.department"
                :key="department"
                >{{ department }}</text
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </form>
</template>

<style lang="css" scoped>
.user-info-container {
  display: flex;
  flex-direction: row;
  width: 100%;
}

.user-avatar {
  width: 6rem;
  height: 6rem;
  overflow: hidden;
  border-radius: 50%;
  outline: 2px solid var(--minecraft-gray-light);
  position: relative;
}

.user-avatar:hover {
  cursor: pointer;
}

.user-avatar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  transition: all 0.2s ease-in-out;
  background-color: transparent;
}

.user-avatar::after {
  content: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" ><path fill="white" d="M832 512a32 32 0 1 1 64 0v352a32 32 0 0 1-32 32H160a32 32 0 0 1-32-32V160a32 32 0 0 1 32-32h352a32 32 0 0 1 0 64H192v640h640z"></path><path fill="white" d="m469.952 554.24 52.8-7.552L847.104 222.4a32 32 0 1 0-45.248-45.248L477.44 501.44l-7.552 52.8zm422.4-422.4a96 96 0 0 1 0 135.808l-331.84 331.84a32 32 0 0 1-18.112 9.088L436.8 623.68a32 32 0 0 1-36.224-36.224l15.104-105.6a32 32 0 0 1 9.024-18.112l331.904-331.84a96 96 0 0 1 135.744 0z"></path></svg>');
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1.5rem;
  height: 1.5rem;
  transform: translate(-50%, -50%);
  user-select: none;
  opacity: 0;
  transition: all 0.2s ease-in-out;
}

.user-avatar:hover::before {
  background-color: rgba(0, 0, 0, 0.5);
}

.user-avatar:hover::after {
  opacity: 1;
}

.avatar-img {
  width: 6rem;
  height: 6rem;
  object-fit: cover;
  object-position: center;
  vertical-align: middle;
  border-style: none;
  user-select: none;
  border-radius: 50%;
  outline: 2px solid var(--minecraft-gray-light);
}

.user-info-label {
  font-size: 0.8rem;
  user-select: none;
  color: white;
  text-wrap: nowrap;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-left: 1rem;
}

.user-info-span {
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  gap: 0.5rem;
}

.user-info-text {
  color: white;
  font-size: 1.2rem;
}

.user-info-tag {
  user-select: none;
  font-size: 0.8rem;
  padding: 2px 4px;
  border-radius: 4px;
  text-wrap: unwrap;
}

.user-input {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.user-input-label {
  font-size: 1.2rem;
  user-select: none;
  text-wrap: nowrap;
  width: 6rem;
}

.user-input-field {
  max-width: 10rem;
  font-size: 1rem;
  padding: 0.2rem;
}

.user-input-field[type='password'] {
  height: 30px;
  font-size: 0.6rem;
}

.user-input-button {
  width: 5rem;
}

.form-btn-group {
  display: flex;
  gap: 1rem;
}

.user-card-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
  gap: 1rem;
}

.user-card {
  display: flex;
  padding: 1rem;

  background-color: #2e2e2e;
  border: 2px solid #1a1a1a;
  box-shadow:
    inset -2px -2px 0 0 #1f1f1f,
    inset 2px 2px 0 0 #454545;
  color: #e0e0e0;

  cursor: pointer;
}

@media screen and (max-width: 524px) {
  .user-info-container {
    flex-direction: column;
  }

  .user-card {
    flex-direction: column;
  }

  .user-info {
    margin-left: 0;
    margin-top: 1rem;
  }
}

.user-info-group {
  display: flex;
  flex-direction: column;
  align-self: flex-end;
}

.user-info-group-item {
  font-size: 0.8rem;
  text-wrap: nowrap;
  user-select: none;
}
</style>
