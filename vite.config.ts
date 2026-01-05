import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-files',
      closeBundle() {
        // 复制 manifest.json
        copyFileSync('manifest.json', 'dist/manifest.json');

        // 复制 content.css
        copyFileSync('src/content/styles.css', 'dist/content.css');

        // 创建 icons 目录
        try {
          mkdirSync('dist/icons', { recursive: true });
        } catch (e) {
          // 目录已存在
        }

        // 复制图标文件（如果存在）
        const iconSizes = ['16', '48', '128'];
        const iconPath = 'public/icons/icon.svg';

        if (existsSync(iconPath)) {
          // 暂时将 SVG 复制为所有尺寸的占位符
          iconSizes.forEach((size) => {
            copyFileSync(iconPath, `dist/icons/icon${size}.png`);
          });
        }

        console.log('✓ Copied manifest.json, content.css, and icons to dist/');
      },
    },
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'src/sidepanel/index.html'),
        background: resolve(__dirname, 'src/background/service-worker.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
    outDir: 'dist',
  },
});
