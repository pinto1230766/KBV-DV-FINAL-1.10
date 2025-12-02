/// <reference types="vitest" />
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isDev = mode === 'development';
    
    return {
      server: {
        port: 3000,
        host: 'localhost',
        strictPort: true,
        hmr: {
          host: 'localhost',
          port: 3000,
          protocol: 'ws',
          overlay: false
        },
        watch: {
          usePolling: true
        },
        fs: {
          strict: true,
        },
      },
      preview: {
        port: 3000,
        strictPort: true,
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
        'process.env.NODE_ENV': JSON.stringify(mode),
        'process.env.IS_DEV': isDev,
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      css: {
        devSourcemap: true,
      },
      build: {
        cssCodeSplit: false,
        sourcemap: true,
        rollupOptions: {
          output: {
            inlineDynamicImports: false
          }
        }
      },
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './setupTests.ts',
      }
    };
});
