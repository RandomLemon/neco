<template>
  <div>
    <canvas ref="pdfCanvas"></canvas>

    <div v-if="loading" class="status-message">PDF 加载中...</div>
    <div v-if="error" class="status-message error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
// 导入主要的 PDF Document 和 Page 类型，以便进行标注
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import type { RenderParameters } from 'pdfjs-dist/types/src/display/api'

// 假设你已经处理了 workerSrc 的设置
// 替换为你的实际 Worker 路径
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.mjs'

// -----------------------------------------------------------
// 1. Props 定义
// -----------------------------------------------------------

interface Props {
  // 必须传入的 PDF 文件 URL
  pdfUrl: string
  // 可选的渲染缩放比例，默认为 1.5
  scale?: number
  // 可选的要渲染的页码，默认为 1
  pageNumber?: number
}

// 使用 withDefaults 来定义 props 并设置默认值，以确保类型推导正确
const props = withDefaults(defineProps<Props>(), {
  scale: 1.5,
  pageNumber: 1,
})

// -----------------------------------------------------------
// 2. 响应式状态
// -----------------------------------------------------------

// ref 必须明确指定它可能持有值的类型
const pdfCanvas = ref<HTMLCanvasElement | null>(null)
const loading = ref<boolean>(true)
const error = ref<string | null>(null)

// -----------------------------------------------------------
// 3. 核心渲染函数
// -----------------------------------------------------------

/**
 * 加载并渲染指定 URL 的 PDF 页面。
 * @param url PDF 文件的 URL。
 * @param pageNum 要渲染的页码。
 * @param scale 缩放比例。
 */
const renderPdf = async (url: string, pageNum: number, scale: number) => {
  if (!pdfCanvas.value || !url) {
    error.value = 'PDF 路径无效或 Canvas 元素未准备好。'
    loading.value = false
    return
  }

  loading.value = true
  error.value = null

  const canvas: HTMLCanvasElement = pdfCanvas.value
  const context: CanvasRenderingContext2D | null = canvas.getContext('2d')

  if (!context) {
    error.value = 'Canvas 上下文获取失败。'
    loading.value = false
    return
  }

  try {
    // 1. 获取 PDF 文档
    const loadingTask = pdfjsLib.getDocument(url)
    // 明确标注 pdf 的类型为 PDFDocumentProxy
    const pdf: PDFDocumentProxy = await loadingTask.promise

    // 2. 获取指定页
    // 明确标注 page 的类型为 PDFPageProxy
    const page: PDFPageProxy = await pdf.getPage(pageNum)

    // 3. 设置 Viewport
    const viewport = page.getViewport({ scale: scale })

    // 4. 设置 Canvas 尺寸
    canvas.height = viewport.height
    canvas.width = viewport.width

    // 5. 渲染页面到 Canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    }
    // .promise 确保渲染完成后才继续执行
    await page.render(renderContext as RenderParameters).promise

    loading.value = false

  } catch (err) {
    console.error('Error during PDF rendering:', err)
    // 捕获错误并显示给用户
    error.value = `无法加载或渲染 PDF 文件。详情: ${(err as Error).message || '未知错误'}`
    loading.value = false
  }
}

// -----------------------------------------------------------
// 4. 生命周期和监听
// -----------------------------------------------------------

onMounted(() => {
  // 组件挂载后立即渲染 PDF
  renderPdf(props.pdfUrl, props.pageNumber, props.scale)
})

// 监听 props 变化，以便在外部更改 URL 或缩放时自动重新渲染
watch([() => props.pdfUrl, () => props.pageNumber, () => props.scale], ([newUrl, newPageNum, newScale]) => {
  renderPdf(newUrl, newPageNum, newScale)
})

</script>

<style scoped>
.status-message {
  padding: 10px;
  text-align: center;
  font-weight: bold;
}
.error {
  color: red;
}
canvas {
  border: 1px solid #ccc;
  display: block;
  margin: 0 auto;
  max-width: 100%;
  height: auto;
}
</style>
