import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      external: () => false,
      treeshake: {
        preset: 'recommended',
        moduleSideEffects: false
      },
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'mantine-vendor': ['@mantine/core', '@mantine/hooks', '@mantine/modals', '@mantine/notifications'],
          'router-vendor': ['react-router-dom']
        }
      }
    },
    chunkSizeWarningLimit: 800,
    sourcemap: false, // Disable sourcemaps for smaller build
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    }
  }
});
