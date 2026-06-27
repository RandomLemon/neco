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

const adminToText = (admin: string): string => {
  switch (admin) {
    case 'admin':
      return '超级管理'
    case 'news_admin':
      return '文章管理'
    case 'server_admin':
      return '服务器管理'
    case 'document_admin':
      return '文档管理'
    case 'bot_admin':
      return '机器人管理'
    default:
      return ''
  }
}

const toBase64 = async (image: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (image.size > 5 * 1024 * 1024) {
      return reject(new Error('File size exceeds 5MB'))
    }
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
const username = ref(localStorage.getItem('username') || 'Undefined')
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
const editUsername = ref('Undefined')

const editAdminSwitch = ref(true)
const editNewsAdminSwitch = ref(false)
const editServerAdminSwitch = ref(false)
const editDocumentAdminSwitch = ref(false)
const editBotAdminSwitch = ref(false)

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
  audio.volume = 0.3
  audio.play().catch(() => {})
}

const saveEditUser = async () => {
  const group = []
  if (editAdminSwitch.value) group.push('admin')
  if (editNewsAdminSwitch.value) group.push('news_admin')
  if (editServerAdminSwitch.value) group.push('server_admin')
  if (editDocumentAdminSwitch.value) group.push('document_admin')
  if (editBotAdminSwitch.value) group.push('bot_admin')

  const result = await UpdateUserInfo(editUsername.value, group, editUserTags.value)
  if (!result) {
    toast.success('修改成功！')
    refreshPage()
  } else {
    toast.error(`修改失败！`)
  }
}

const loadEditUser = (user: UserEntity, index: number) => {
  editUsername.value = user.username
  editAvatar.value = avatars.value[index] || '/nmo-logo-large.png'
  editAdminSwitch.value = (user.group || []).includes('admin')
  editNewsAdminSwitch.value = (user.group || []).includes('news_admin')
  editServerAdminSwitch.value = (user.group || []).includes('server_admin')
  editDocumentAdminSwitch.value = (user.group || []).includes('document_admin')
  editBotAdminSwitch.value = (user.group || []).includes('bot_admin')
  editUserTags.value = JSON.parse(JSON.stringify(user.tags || []))
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

const oldPasswordInput = ref('')
const newPasswordInput = ref('')
const repeatPasswordInput = ref('')

const resetChangePassword = () => {
  oldPasswordInput.value = ''
  newPasswordInput.value = ''
  repeatPasswordInput.value = ''
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
  refreshPage()
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
    refreshPage()
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
    refreshPage()
  } else {
    toast.error(`删除用户失败！`)
  }
}

const refreshPage = async () => {
  if (userGroup.value.includes('admin')) {
    avatars.value = []
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
}

onMounted(() => {
  refreshPage()
})
</script>

<template>
  <div class="management-tab-title-container">
    <h1 class="management-tab-title">用户管理</h1>
    <span class="management-tab-subtitle">到底有多强？</span>
  </div>
  <section class="management-tab-form" aria-labelledby="current-user-title">
    <h2 id="current-user-title" class="management-tab-form-title">当前用户信息</h2>
    <div class="user-info-container">
      <button
        type="button"
        class="user-avatar"
        aria-label="修改当前用户头像"
        @click="onChangeAvatar"
      >
        <img class="avatar-img" :src="avatar" alt="" />
      </button>
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
              adminToText(group)
            }}</text>
          </div>
        </div>
      </div>
    </div>
  </section>
  <form class="management-tab-form" @submit.prevent="onChangePassword">
    <h2 class="management-tab-form-title">修改密码</h2>
    <div class="user-input">
      <label class="user-input-label" for="old-password-input"> 旧密码 </label>

      <MinecraftInput
        id="old-password-input"
        class="user-input-field"
        placeholder="输入旧密码"
        type="password"
        autocomplete="current-password"
        v-model="oldPasswordInput"
      />
    </div>
    <div class="user-input">
      <label class="user-input-label" for="new-password-input"> 新密码 </label>

      <MinecraftInput
        id="new-password-input"
        class="user-input-field"
        placeholder="输入新密码"
        type="password"
        autocomplete="new-password"
        v-model="newPasswordInput"
      />
    </div>
    <div class="user-input">
      <label class="user-input-label" for="repeat-password-input"> 重复密码 </label>

      <MinecraftInput
        id="repeat-password-input"
        class="user-input-field"
        placeholder="输入重复密码"
        type="password"
        autocomplete="new-password"
        v-model="repeatPasswordInput"
      />
    </div>
    <div class="form-btn-group">
      <MinecraftButtonClassic class="user-input-button" @click="resetChangePassword">
        重置
      </MinecraftButtonClassic>

      <MinecraftButtonClassic class="user-input-button" native-type="submit">
        保存
      </MinecraftButtonClassic>
    </div>
  </form>
  <section
    class="management-tab-form"
    v-if="userGroup.includes('admin')"
    aria-labelledby="account-management-title"
  >
    <div style="display: flex">
      <h2 id="account-management-title" class="management-tab-form-title">账户管理</h2>
      <span class="management-tab-form-subtitle">点击以编辑！</span>
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
      <div class="user-card" v-for="(user, index) in filteredUsers" :key="user.username">
        <button
          type="button"
          class="user-card-main"
          :aria-label="`编辑用户 ${user.username}`"
          @click="(soundOn(), loadEditUser(user, index))"
        >
          <img class="avatar-img" style="width: 4rem; height: 4rem" :src="avatars[index]" alt="" />

          <div class="user-info">
            <div class="user-info-span">
              <span class="user-info-text">{{ user.username }}</span>

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
              <span class="user-info-label">权限：</span>

              <div class="user-info-group">
                <span class="user-info-group-item" v-for="group in user.group" :key="group">
                  {{ adminToText(group) }}
                </span>
              </div>
            </div>
          </div>
        </button>

        <button
          type="button"
          class="delete-user"
          :aria-label="`删除用户 ${user.username}`"
          @click.stop="onDeleteUser(user.username)"
        >
          <DeleteIcon aria-hidden="true" />
        </button>
      </div>
    </div>
  </section>

  <MinecraftDialog title="修改用户信息" v-model="editUserDialogVisible" @confirm="saveEditUser">
    <div class="change-user-info-container">
      <div class="change-user-info-item">
        <text class="change-user-info-title">头像</text>
        <button
          v-if="editUsername === username"
          type="button"
          class="user-avatar"
          style="width: 4rem; height: 4rem"
          aria-label="修改用户头像"
          @click="onChangeAvatar"
        >
          <img class="avatar-img" style="width: 4rem; height: 4rem" :src="editAvatar" alt="" />
        </button>
        <img
          class="avatar-img"
          v-else
          style="width: 4rem; height: 4rem"
          :src="editAvatar"
          alt="用户头像"
        />
      </div>
      <div class="change-user-info-item">
        <label class="change-user-info-title" for="edit-username-input"> 用户名 </label>

        <MinecraftInput
          id="edit-username-input"
          class="user-input-field"
          placeholder="输入用户名"
          v-model="editUsername"
        />
      </div>
      <div class="change-user-info-item">
        <text class="change-user-info-title">权限</text>
        <div class="user-switch-item">
          <MinecraftSwitch
            id="edit-admin-switch"
            class="user-input-switch"
            v-model="editAdminSwitch"
            @on="
              editNewsAdminSwitch =
                editServerAdminSwitch =
                editDocumentAdminSwitch =
                editBotAdminSwitch =
                  false
            "
          />
          <label class="user-switch-label" for="edit-admin-switch"> 超级管理 </label>
        </div>
        <div class="user-switch-item">
          <MinecraftSwitch
            id="edit-article-admin-switch"
            class="user-input-switch"
            v-model="editNewsAdminSwitch"
            @on="editAdminSwitch = false"
          />
          <label class="user-switch-label" for="edit-article-admin-switch"> 文章管理 </label>
        </div>
        <div class="user-switch-item">
          <MinecraftSwitch
            id="edit-server-admin-switch"
            class="user-input-switch"
            v-model="editServerAdminSwitch"
            @on="editAdminSwitch = false"
          />
          <label class="user-switch-label" for="edit-server-admin-switch"> 服务器管理 </label>
        </div>
        <div class="user-switch-item">
          <MinecraftSwitch
            id="edit-document-admin-switch"
            class="user-input-switch"
            v-model="editDocumentAdminSwitch"
            @on="editAdminSwitch = false"
          />
          <label class="user-switch-label" for="edit-document-admin-switch"> 文档管理 </label>
        </div>
        <div class="user-switch-item">
          <MinecraftSwitch
            id="edit-bot-admin-switch"
            class="user-input-switch"
            v-model="editBotAdminSwitch"
            @on="editAdminSwitch = false"
          />
          <label class="user-switch-label" for="edit-bot-admin-switch"> 机器人管理 </label>
        </div>
      </div>
      <div class="change-user-info-item" style="grid-column: span 2">
        <text class="change-user-info-title">标签</text>
        <div class="user-input-with-label">
          <label class="user-input-title" for="edit-tag-text-input"> 标签文字 </label>

          <MinecraftInput
            id="edit-tag-text-input"
            class="user-input-box"
            placeholder="回车以添加"
            v-model="editInputTagText"
            @keyup.enter="editAppendTag"
          />
        </div>
        <div class="user-input-with-label">
          <label class="user-input-title" for="edit-tag-text-color-input"> 文字颜色 </label>

          <MinecraftInput
            id="edit-tag-text-color-input"
            class="user-input-box"
            placeholder="标签文字颜色"
            v-model="editInputTagColor"
            @keyup.enter="editAppendTag"
          />
        </div>
        <div class="user-input-with-label">
          <label class="user-input-title" for="edit-tag-background-color-input"> 背景颜色 </label>

          <MinecraftInput
            id="edit-tag-background-color-input"
            class="user-input-box"
            placeholder="标签背景颜色"
            v-model="editInputTagBgColor"
            @keyup.enter="editAppendTag"
          />
        </div>
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
      <label class="avatar-options-label" for="avatar-url-input">头像地址</label>
      <div class="avatar-options-input-container">
        <MinecraftInput
          id="avatar-url-input"
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
      <span class="avatar-options-label">直接上传</span>
      <MinecraftButtonClassic
        class="avatar-options-button"
        style="width: 10rem"
        @click="onSelectAvatar"
      >
        ↑ 点击上传
      </MinecraftButtonClassic>
    </div>
    <template v-slot:footer>
      <span></span>
    </template>
  </MinecraftDialog>
  <MinecraftDialog title="创建用户" v-model="createUserDialogVisible" @confirm="onSaveCreateUser">
    <div class="create-user-container">
      <div class="create-user-container">
        <label class="create-user-info-title" for="create-user-username-input"> 用户名 </label>

        <MinecraftInput
          id="create-user-username-input"
          class="create-user-input"
          placeholder="输入用户名"
          autocomplete="username"
          v-model="createUserUsername"
          @keyup.enter="onSaveCreateUser"
        />
      </div>
      <div class="create-user-container">
        <label class="create-user-info-title" for="create-user-password-input"> 密码 </label>

        <MinecraftInput
          id="create-user-password-input"
          class="create-user-input"
          placeholder="输入密码"
          type="password"
          autocomplete="new-password"
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
.user-card-main {
  display: flex;
  flex: 1;
  min-width: 0;

  border: 0;
  padding: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.user-card-main:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 4px;
}

.delete-user {
  border: 0;
  padding: 0;
  background: transparent;
  color: rgb(247, 137, 137);
  cursor: pointer;
}

.delete-user:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 3px;
}

.user-avatar {
  border: 0;
  padding: 0;
  background: transparent;
  color: inherit;
}

.user-avatar:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 4px;
}

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
