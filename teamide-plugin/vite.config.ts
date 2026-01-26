import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'SPGPlugin',
      formats: ['iife'],
      fileName: () => 'index.js'
    },
    outDir: 'dist',
    rollupOptions: {
      external: ['vue', 'quasar', 'pinia'],
      output: {
        globals: {
          vue: 'Vue',
          quasar: 'Quasar',
          pinia: 'Pinia'
        },
        // Export to exports.default for TeamIDE loader
        footer: 'exports.default = SPGPlugin.default || SPGPlugin;'
      }
    }
  }
});
