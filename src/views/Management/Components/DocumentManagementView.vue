<script lang="ts" setup>
import MinecraftButtonClassic from '@/components/utils/MinecraftButtonClassic.vue'
import DocumentsEditor from '@/views/Documents/DocumentsEditor.vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const userGroup = JSON.parse(localStorage.getItem('userGroup') || '[]') as string[]

const canManageDocument = computed(() => {
  return userGroup.includes('admin') || userGroup.includes('document_admin')
})
</script>

<template>
  <div class="management-tab-title-container">
    <h1 class="management-tab-title">文档管理</h1>
    <span class="management-tab-subtitle">你所热爱的就是你的生活</span>
  </div>

  <section
    v-if="!canManageDocument"
    class="management-section"
    aria-labelledby="doc-no-permission-title"
  >
    <div class="management-empty-state">
      <strong id="doc-no-permission-title">权限不足</strong>
      <span>只有超级管理员或文档管理员可以编辑文档。</span>
    </div>
  </section>

  <template v-else>
    <section class="management-section" aria-labelledby="doc-overview-title">
      <div class="management-section-header">
        <div class="management-section-title-block">
          <h2 id="doc-overview-title" class="management-section-title">文档编辑器</h2>
        </div>

        <div class="management-toolbar">
          <MinecraftButtonClassic
            class="document-toolbar-button"
            @click="router.push('/documents')"
          >
            查看文档页
          </MinecraftButtonClassic>

          <MinecraftButtonClassic
            class="document-toolbar-button"
            @click="router.push('/documents_editor')"
          >
            全屏编辑
          </MinecraftButtonClassic>
        </div>
      </div>

      <div class="document-helper-grid">
        <article class="management-card">
          <h3 class="management-card-title">编辑提示</h3>
          <p class="document-helper-text">
            修改文档结构时，请尽量保持标题清晰、层级稳定，避免频繁移动已有节点导致外部链接失效。
          </p>
        </article>

        <article class="management-card">
          <h3 class="management-card-title">附件提示</h3>
          <p class="document-helper-text">
            上传图片或附件后，建议在页面中确认资源是否能正常加载；删除资源前请确认没有页面继续引用。
          </p>
        </article>
      </div>
    </section>

    <section class="management-section" aria-labelledby="doc-editor-title">
      <div class="management-section-header">
        <div class="management-section-title-block">
          <h2 id="doc-editor-title" class="management-section-title">内嵌编辑区</h2>
        </div>
      </div>

      <div class="document-editor-frame">
        <DocumentsEditor />
      </div>
    </section>
  </template>
</template>

<style lang="css" scoped>
.document-toolbar-button {
  width: 8rem;
}

.document-helper-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: 1rem;
}

.document-helper-text {
  margin: 0;
  color: rgba(255, 255, 255, 0.74);
  line-height: 1.45rem;
  user-select: none;
}

.document-editor-frame {
  width: 100%;
  height: min(72vh, 52rem);
  min-height: 36rem;
  overflow: hidden;
  background-color: rgba(0, 0, 0, 0.18);
  border: 2px solid #1a1a1a;
}

.document-editor-frame :deep(.documents-editor),
.document-editor-frame :deep(.resizer-container),
.document-editor-frame :deep(.editor-container) {
  height: 100%;
  min-height: 0;
}

@media screen and (max-width: 768px) {
  .document-toolbar-button {
    width: 100%;
  }
}
</style>
