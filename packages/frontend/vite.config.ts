import path from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { consoleForwardPlugin } from 'vite-console-forward-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss(), consoleForwardPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 7000,
  },
})
