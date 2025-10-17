import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: process.env.VITE_IS_GITHUB_PAGES ? '/neco/' : '/',

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },

  server: {
    host: "0.0.0.0",
    proxy: {
      "/necore": {
        target: "http://localhost:3000",
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/necore/, '')
      }
    },
    allowedHosts: [
      "test.nmo.net.cn",
      "www.nmo.net.cn",
      "nmo.net.cn",
    ]
  }
})
