<script lang="ts" setup>
import {
  CreateUser,
  DeleteUser,
  GetAvatar,
  GetUserList,
  UpdateAvatar,
  UpdatePassword,
  UpdateUserInfo,
  type UserEntity,
} from '@/api/auth'
import DeleteIcon from '@/components/icons/DeleteIcon.vue'
import MinecraftButtonClassic from '@/components/utils/MinecraftButtonClassic.vue'
import MinecraftDialog from '@/components/utils/MinecraftDialog.vue'
import MinecraftInput from '@/components/utils/MinecraftInput.vue'
import MinecraftSwitch from '@/components/utils/MinecraftSwitch.vue'
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
const username = ref(localStorage.getItem('username') || 'Kingcq')
const userGroup = ref(JSON.parse(localStorage.getItem('userGroup') || '[]'))
const userTags = ref(
  JSON.parse(
    localStorage.getItem('userTags') ||
      `[
    {
      "text": "管理员",
      "color": "#E6A23C",
      "tagColor": "rgba(230, 162, 60, 0.1)"
    }
  ]`,
  ),
)

const editAvatar = ref('/nmo-logo-large.png')
const editUsername = ref('Kingcq')
const editAdminSwitch = ref(true)
const editNewsAdminSwitch = ref(false)
const editUserTags = ref([
  {
    text: '管理员',
    color: '#E6A23C',
    tagColor: 'rgba(230, 162, 60, 0.1)',
  },
])
const editInputTagText = ref('')
const editInputTagColor = ref('#E6A23C')
const editInputTagBgColor = ref('rgba(230, 162, 60, 0.1)')

const soundOn = () => {
  const audio = new Audio('/button.click.ogg')
  audio.play()
  audio.volume = 0.3
}

const saveEditUser = async () => {
  const group = []
  if (editAdminSwitch.value) group.push('admin')
  if (editNewsAdminSwitch.value) group.push('news_admin')

  const result = await UpdateUserInfo(editUsername.value, group, editUserTags.value)
  if (!result) {
    toast.success('修改成功！')
  } else {
    toast.error(`修改失败！`)
  }
}

const loadEditUser = async (user: UserEntity) => {
  editUsername.value = user.username
  editAdminSwitch.value = (user.group || []).includes('admin')
  editNewsAdminSwitch.value = (user.group || []).includes('news_admin')
  editUserTags.value = JSON.parse(JSON.stringify(user.tags))
  editInputTagText.value = ''
  editInputTagColor.value = '#E6A23C'
  editInputTagBgColor.value = 'rgba(230, 162, 60, 0.1)'

  editUserDialogVisible.value = true
}

const editAppendTag = () => {
  if (editInputTagText.value.trim() === '') {
    toast.warning('请输入标签！')
    return
  }
  editUserTags.value.push({
    text: editInputTagText.value,
    color: editInputTagColor.value,
    tagColor: editInputTagBgColor.value,
  })
  editInputTagText.value = ''
  editInputTagColor.value = '#E6A23C'
  editInputTagBgColor.value = 'rgba(230, 162, 60, 0.1)'
}

const editDeleteTag = (index: number) => {
  editUserTags.value.splice(index, 1)
}

const updateLocalStorage = () => {
  username.value = localStorage.getItem('username') || 'Kingcq'
  userGroup.value = JSON.parse(localStorage.getItem('userGroup') || '["admin"]')
  userTags.value = JSON.parse(
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
  usernameInput.value = username.value
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
  const result = await UpdateUserInfo(usernameInput.value, userGroup.value, userTags.value)
  if (!result) {
    toast.success('修改成功！')
    updateLocalStorage()
  } else {
    toast.error(`修改失败！`)
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
  const result = await UpdatePassword(
    username.value,
    oldPasswordInput.value,
    newPasswordInput.value,
  )
  if (!result) {
    toast.success('修改成功！')
    resetChangePassword()
  } else {
    toast.error(`修改失败！`)
  }
}

const avatarSrc = ref('')
const avatarOptionsVisible = ref(false)

const onChangeAvatar = () => {
  avatarSrc.value = ''
  avatarOptionsVisible.value = true
}

const onSaveAvatar = async (src: string) => {
  if (src.trim() === '') {
    toast.warning('图片地址不可为空！')
    return
  }
  avatarOptionsVisible.value = false
  let result = await UpdateAvatar(username.value, src)
  if (result) {
    toast.error('上传头像失败！')
    return
  }
  result = await GetAvatar(username.value)
  if (!result) {
    toast.warning('获取头像失败！')
    return
  }
  avatar.value = result
  if (!users.value) {
    return
  }
  for (let index = 0; index < users.value.length; index++) {
    if (users.value[index].username === username.value) {
      avatars.value[index] = result
      break
    }
  }
}

const onSelectAvatar = async () => {
  try {
    const base64str = await triggerUploadBase64()
    await onSaveAvatar(base64str)
  } catch (e) {
    toast.error(`上传文件失败：${e}！`)
    return
  }
}

const users = ref<Array<UserEntity> | null>([])
const avatars = ref<Array<string>>([])
const searchKeyword = ref('')

const filteredUsers = computed(() => {
  if (!users.value) return []
  return users.value.filter((user) =>
    user.username.toLowerCase().includes(searchKeyword.value.toLowerCase()),
  )
})

const editUserDialogVisible = ref(false)
const createUserDialogVisible = ref(false)
const createUserUsername = ref('')
const createUserPassword = ref('')

const onCreateUser = () => {
  createUserUsername.value = ''
  createUserPassword.value = ''
  createUserDialogVisible.value = true
}

const onSaveCreateUser = async () => {
  if (createUserUsername.value.trim() === '') {
    toast.warning('用户名不能为空！')
    return
  }
  if (createUserPassword.value.trim() === '') {
    toast.warning('密码不能为空！')
    return
  }
  const result = await CreateUser(createUserUsername.value, createUserPassword.value)
  if (!result) {
    toast.success('创建用户成功！')
    createUserDialogVisible.value = false
  } else {
    toast.error(`创建用户失败！`)
  }
}

const deleteUserDialogVisible = ref(false)
let deleteUsername = ''

const onDeleteUser = async (username: string) => {
  deleteUserDialogVisible.value = true
  deleteUsername = username
}

const onConfirmDeleteUser = async () => {
  if (deleteUsername === username.value) {
    toast.info('冷知识：你不能杀死你自己！')
    return
  }
  const result = await DeleteUser(deleteUsername)
  if (!result) {
    toast.success('删除用户成功！')
    users.value = users.value?.filter((user) => user.username !== deleteUsername) || null
  } else {
    toast.error(`删除用户失败！`)
  }
}

onMounted(async () => {
  if (userGroup.value.includes('admin')) {
    users.value = (await GetUserList()) || []
    for (let i = 0; i < users.value.length; i++) {
      avatars.value.push((await GetAvatar(users.value[i].username)) || '/nmo-logo-large.png')
    }
    if (!users.value) {
      toast.warning('获取用户列表失败！')
    }
  }
  avatar.value = (await GetAvatar(username.value)) || '/nmo-logo-large.png'
  if (avatar.value.trim() === '') {
    avatar.value = '/nmo-logo-large.png'
  }
})
</script>

<template>
  <div class="management-tab-title-container">
    <text class="management-tab-title">用户管理</text>
    <text class="management-tab-subtitle">到底有多强？</text>
  </div>
  <form class="management-tab-form">
    <text class="management-tab-form-title">当前用户信息</text>
    <div class="user-info-container">
      <picture class="user-avatar" @click="onChangeAvatar">
        <img class="avatar-img" :src="avatar" alt="用户头像" />
      </picture>
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
              group === 'admin' ? '超级管理' : '文章管理'
            }}</text>
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
    <div style="display: flex; width: min-content; gap: 1rem">
      <MinecraftInput
        class="user-input-field"
        placeholder="查找用户"
        v-model="searchKeyword"
        style="margin-left: 2px"
      />
      <MinecraftButtonClassic style="width: 6rem" @click="onCreateUser"
        >创建用户</MinecraftButtonClassic
      >
    </div>
    <div class="user-card-container">
      <div
        class="user-card"
        v-for="(user, index) in filteredUsers"
        :key="user.username"
        @click="(soundOn(), loadEditUser(user))"
      >
        <DeleteIcon class="delete-user" @click.stop="onDeleteUser(user.username)" />
        <img
          class="avatar-img"
          style="width: 4rem; height: 4rem"
          :src="avatars[index]"
          alt="用户头像"
        />
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
          <div class="user-info-span" v-if="(user.group || []).length > 0">
            <text class="user-info-label">权限：</text>
            <div class="user-info-group">
              <text class="user-info-group-item" v-for="group in user.group" :key="group">{{
                group === 'admin' ? '超级管理' : '文章管理'
              }}</text>
            </div>
          </div>
        </div>
      </div>
    </div>
  </form>

  <MinecraftDialog title="修改用户信息" v-model="editUserDialogVisible" @confirm="saveEditUser">
    <div class="change-user-info-container">
      <div class="change-user-info-item">
        <text class="change-user-info-title">头像</text>
        <picture
          class="user-avatar"
          style="width: 4rem; height: 4rem"
          @click="onChangeAvatar"
          v-if="editUsername === username"
        >
          <img
            class="avatar-img"
            style="width: 4rem; height: 4rem"
            :src="editAvatar"
            alt="用户头像"
          />
        </picture>
        <img
          class="avatar-img"
          v-else
          style="width: 4rem; height: 4rem"
          :src="editAvatar"
          alt="用户头像"
        />
      </div>
      <div class="change-user-info-item">
        <text class="change-user-info-title">用户名</text>
        <div>
          <MinecraftInput
            class="user-input-field"
            placeholder="输入用户名"
            v-model="editUsername"
          />
        </div>
      </div>
      <div class="change-user-info-item">
        <text class="change-user-info-title">权限</text>
        <div class="user-switch-item">
          <MinecraftSwitch
            class="user-input-switch"
            v-model="editAdminSwitch"
            @on="editNewsAdminSwitch = false"
          />
          <text class="user-switch-label">超级管理</text>
        </div>
        <div class="user-switch-item">
          <MinecraftSwitch
            class="user-input-switch"
            v-model="editNewsAdminSwitch"
            @on="editAdminSwitch = false"
          />
          <text class="user-switch-label">文章管理</text>
        </div>
      </div>
      <div class="change-user-info-item" style="grid-column: span 2">
        <text class="change-user-info-title">标签</text>
        <text class="user-input-with-label">
          <text class="user-input-title">标签文字</text>
          <MinecraftInput
            class="user-input-box"
            placeholder="回车以添加"
            v-model="editInputTagText"
            @keyup.enter="editAppendTag"
          />
        </text>
        <text class="user-input-with-label">
          <text class="user-input-title">文字颜色</text>
          <MinecraftInput
            class="user-input-box"
            placeholder="标签文字颜色"
            v-model="editInputTagColor"
            @keyup.enter="editAppendTag"
          />
        </text>
        <text class="user-input-with-label">
          <text class="user-input-title">背景颜色</text>
          <MinecraftInput
            class="user-input-box"
            placeholder="标签背景颜色"
            v-model="editInputTagBgColor"
            @keyup.enter="editAppendTag"
          />
        </text>
        <div class="tags-container">
          <div
            class="tag"
            v-for="(tag, index) in editUserTags"
            :key="index"
            :style="{
              color: tag.color,
              backgroundColor: tag.tagColor,
            }"
          >
            <text class="tag-text">{{ tag.text }}</text>
            <DeleteIcon class="tag-delete-icon" @click="editDeleteTag(index)" />
          </div>
        </div>
      </div>
    </div>
  </MinecraftDialog>
  <MinecraftDialog title="修改头像" v-model="avatarOptionsVisible">
    <div class="avatar-options-container">
      <text class="avatar-options-label">头像地址</text>
      <div class="avatar-options-input-container">
        <MinecraftInput
          class="avatar-options-input"
          v-model="avatarSrc"
          placeholder="填入图片链接"
        />
        <MinecraftButtonClassic class="avatar-options-button" @click="onSaveAvatar(avatarSrc)"
          >保存</MinecraftButtonClassic
        >
      </div>
    </div>
    <div class="avatar-options-container">
      <text class="avatar-options-label">直接上传</text>
      <MinecraftButtonClassic
        class="avatar-options-button"
        style="width: 10rem"
        @click="onSelectAvatar"
        >↑点击上传</MinecraftButtonClassic
      >
    </div>
    <template v-slot:footer>
      <span></span>
    </template>
  </MinecraftDialog>
  <MinecraftDialog title="创建用户" v-model="createUserDialogVisible" @confirm="onSaveCreateUser">
    <div class="create-user-container">
      <div class="create-user-container">
        <text class="create-user-info-title">用户名</text>
        <MinecraftInput
          class="create-user-input"
          placeholder="输入用户名"
          v-model="createUserUsername"
          @keyup.enter="onSaveCreateUser"
        />
      </div>
      <div class="create-user-container">
        <text class="create-user-info-title">密码</text>
        <MinecraftInput
          class="create-user-input"
          placeholder="输入密码"
          v-model="createUserPassword"
          @keyup.enter="onSaveCreateUser"
        />
      </div>
    </div>
  </MinecraftDialog>
  <MinecraftDialog
    title="删除用户"
    v-model="deleteUserDialogVisible"
    @confirm="onConfirmDeleteUser"
  >
    <div class="delete-user-container">
      <text class="delete-user-info-text"
        >确定要删除用户 <strong style="color: #e6a23c">{{ deleteUsername }}</strong> 吗？</text
      >
      <text class="delete-user-info-text" style="color: #f56c6c">它将永远消失！（真的很久！）</text>
    </div>
  </MinecraftDialog>
</template>

<style lang="css" scoped>
.user-info-container {
  display: flex;
  flex-direction: row;
  width: 100%;
}

.user-avatar {
  margin-left: 1rem;
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
  user-select: none;
}

.user-info-tag {
  display: flex;
  align-items: center;
  justify-content: center;

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
  padding: 0.5rem;
  margin: auto;
  margin-left: 0;
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
  position: relative;
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

.change-user-info-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr));
  gap: 1rem;
}

.change-user-info-item {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.change-user-info-title {
  font-size: 1.2rem;
  color: white;
  user-select: none;
}

.user-switch-item {
  display: flex;
  align-items: center;
}

.user-input-switch {
  scale: 0.8;
}

.tags-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  background-color: #333;
  border-radius: 4px;
}

.tag-text {
  user-select: none;
  font-size: 0.8rem;
  text-wrap: nowrap;
}

.tag-delete-icon {
  width: 1rem;
  height: 1rem;
  margin-left: 0.5rem;
  color: #f56c6c;
  cursor: pointer;
  user-select: none;
}

.user-input-with-label {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-input-title {
  color: rgba(255, 255, 255, 0.8);
  user-select: none;
  text-wrap: nowrap;
}

.user-input-box {
  width: 80%;
}

.avatar-options-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.avatar-options-label {
  font-size: 1.2rem;
  user-select: none;
}

.avatar-options-input-container {
  display: flex;
  gap: 1rem;
}

.avatar-options-input {
  font-size: 1rem;
  padding: 0.5rem;
  width: 100%;
  margin: auto;
}

.avatar-options-button {
  width: 6rem;
  font-size: 1.2rem;
}

.create-user-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.create-user-info-title {
  font-size: 1.2rem;
  color: white;
  user-select: none;
}

.create-user-input {
  font-size: 1rem;
  padding: 0.5rem;
  width: 100%;
  margin: auto;
}

.delete-user {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;

  width: 1.5rem;
  height: 1.5rem;
  color: rgb(247, 137, 137);
}

.delete-user-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.delete-user-info-text {
  font-size: 1.2rem;
  user-select: none;
}
</style>
