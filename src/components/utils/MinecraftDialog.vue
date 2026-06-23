<script lang="ts" setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import MinecraftButtonClassic from './MinecraftButtonClassic.vue'

const modelValue = defineModel<boolean>({ default: false })
const emits = defineEmits(['confirm'])
const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  cancelText: {
    type: String,
    default: '取消',
  },
  confirmText: {
    type: String,
    default: '确定',
  },
})

const visible = ref(false)
const opacity = ref(0)
const dialogRef = ref<HTMLElement | null>(null)

const animationDuration = 300
const titleId = `minecraft-dialog-title-${Math.random().toString(36).slice(2)}`

let hideTimer: ReturnType<typeof setTimeout> | undefined
let returnFocusElement: HTMLElement | null = null
let previousBodyOverflow = ''

const focusableSelector = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'summary',
  'iframe',
  'object',
  'embed',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

const isElementVisible = (element: HTMLElement) => {
  return Boolean(element.offsetWidth || element.offsetHeight || element.getClientRects().length)
}

const getFocusableElements = () => {
  if (!dialogRef.value) {
    return []
  }

  return Array.from(dialogRef.value.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) => {
      return (
        !element.hasAttribute('disabled') &&
        element.getAttribute('aria-hidden') !== 'true' &&
        isElementVisible(element)
      )
    },
  )
}

const focusInitialElement = async () => {
  await nextTick()

  const focusableElements = getFocusableElements()
  const firstInput = focusableElements.find((element) => {
    return ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName)
  })

  ;(firstInput ?? focusableElements[0] ?? dialogRef.value)?.focus()
}

const lockPageScroll = () => {
  previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
}

const unlockPageScroll = () => {
  document.body.style.overflow = previousBodyOverflow
}

const openDialog = async () => {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = undefined
  }

  returnFocusElement = document.activeElement as HTMLElement | null
  visible.value = true
  lockPageScroll()

  await nextTick()

  requestAnimationFrame(() => {
    opacity.value = 1
  })

  await focusInitialElement()
}

const finishClose = () => {
  visible.value = false
  unlockPageScroll()
  returnFocusElement?.focus()
  returnFocusElement = null
}

const closeDialog = () => {
  modelValue.value = false
}

const closeDialogWithAnimation = () => {
  opacity.value = 0

  if (hideTimer) {
    clearTimeout(hideTimer)
  }

  hideTimer = setTimeout(() => {
    finishClose()
  }, animationDuration)
}

const onConfirm = () => {
  closeDialog()
  emits('confirm')
}

const trapFocus = (event: KeyboardEvent) => {
  const focusableElements = getFocusableElements()

  if (focusableElements.length === 0) {
    event.preventDefault()
    dialogRef.value?.focus()
    return
  }

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]
  const activeElement = document.activeElement

  if (event.shiftKey && activeElement === firstElement) {
    event.preventDefault()
    lastElement.focus()
    return
  }

  if (!event.shiftKey && activeElement === lastElement) {
    event.preventDefault()
    firstElement.focus()
  }
}

const onDialogKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.stopPropagation()
    closeDialog()
    return
  }

  if (event.key === 'Tab') {
    trapFocus(event)
  }
}

watch(modelValue, (newValue) => {
  if (newValue) {
    openDialog()
  } else if (visible.value) {
    closeDialogWithAnimation()
  }
})

onMounted(() => {
  if (modelValue.value) {
    visible.value = true
    opacity.value = 1
    lockPageScroll()
    focusInitialElement()
  }
})

onBeforeUnmount(() => {
  if (hideTimer) {
    clearTimeout(hideTimer)
  }

  if (visible.value) {
    unlockPageScroll()
  }
})
</script>

<template>
  <div
    v-if="visible"
    class="dialog-cover"
    :style="{
      opacity: opacity,
    }"
    @click.self="closeDialog"
    @keydown="onDialogKeydown"
  >
    <div
      ref="dialogRef"
      class="dialog mc-border"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="props.title.trim() !== '' ? titleId : undefined"
      tabindex="-1"
      @click.stop
    >
      <h2 class="dialog-title" :id="titleId" v-if="props.title.trim() !== ''">
        {{ props.title }}
      </h2>

      <div class="dialog-content">
        <slot></slot>
      </div>

      <slot name="footer">
        <div class="dialog-footer">
          <MinecraftButtonClassic class="dialog-footer-btn" @click="closeDialog">
            {{ props.cancelText }}
          </MinecraftButtonClassic>
          <MinecraftButtonClassic class="dialog-footer-btn" @click="onConfirm">
            {{ props.confirmText }}
          </MinecraftButtonClassic>
        </div>
      </slot>
    </div>
  </div>
</template>

<style lang="css" scoped>
.dialog-cover {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow: auto;
  overscroll-behavior: contain;
  background-color: rgba(0, 0, 0, 0.5);

  display: grid;
  place-items: center;
  padding: 1rem;
  box-sizing: border-box;
  z-index: 1024;

  transition: opacity 0.3s ease-in-out;
}

.dialog {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;

  width: min(720px, calc(100vw - 2rem));
  max-width: calc(100vw - 2rem);
  max-height: calc(100vh - 2rem);
  max-height: calc(100dvh - 2rem);
  overflow: auto;

  padding: 1rem;
  z-index: 1025;

  transition: transform 0.3s ease-in-out;
}

.dialog:focus {
  outline: none;
}

.dialog:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 4px;
}

.dialog-title {
  flex: 0 0 auto;
  font-size: 1.5rem;
  line-height: 1.3;
  color: white;
  margin: 0 0 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--minecraft-gray-light);
  user-select: none;
}

.dialog-content {
  flex: 1 1 auto;
  min-width: 0;
}

.dialog-footer {
  flex: 0 0 auto;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--minecraft-gray-light);
}

.dialog-footer-btn {
  width: 6rem;
  font-size: 1.1rem;
}

.dialog :deep(*) {
  box-sizing: border-box;
}

.dialog :deep(input),
.dialog :deep(textarea),
.dialog :deep(select) {
  max-width: 100%;
}

@media screen and (max-width: 768px) {
  .dialog-cover {
    padding: 0.75rem;
  }

  .dialog {
    width: 100%;
    max-width: calc(100vw - 1.5rem);
    max-height: calc(100vh - 1.5rem);
    max-height: calc(100dvh - 1.5rem);
    padding: 0.875rem;
  }

  .dialog-title {
    font-size: 1.25rem;
    margin-bottom: 0.875rem;
    padding-bottom: 0.875rem;
  }

  .dialog-footer {
    justify-content: stretch;
    gap: 0.75rem;
  }

  .dialog-footer-btn {
    flex: 1 1 0;
    width: auto;
    min-width: 0;
  }

  .dialog :deep(.pdf-options-input-container),
  .dialog :deep(.icon-options-input-container) {
    flex-wrap: wrap;
  }

  .dialog :deep(.pdf-options-input),
  .dialog :deep(.icon-options-input) {
    flex: 1 1 12rem;
    min-width: 0;
  }

  .dialog :deep(.pdf-options-button),
  .dialog :deep(.icon-options-button) {
    flex: 0 0 auto;
  }
}

@media screen and (max-width: 420px) {
  .dialog-cover {
    padding: 0.5rem;
  }

  .dialog {
    max-width: calc(100vw - 1rem);
    max-height: calc(100vh - 1rem);
    max-height: calc(100dvh - 1rem);
    padding: 0.75rem;
  }

  .dialog-footer {
    flex-direction: column-reverse;
  }

  .dialog-footer-btn {
    width: 100%;
  }
}
</style>
