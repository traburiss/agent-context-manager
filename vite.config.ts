import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  base: './', // 使用相对路径,适配 Electron
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    host: '127.0.0.1'
  }
});
