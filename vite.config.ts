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
      treeshake: {
        preset: 'recommended',
        moduleSideEffects: false
      },
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('react-router')) {
              return 'router-vendor';
            }
            if (id.includes('@mantine') || id.includes('@emotion')) {
              return 'mantine-vendor';
            }
            if (id.includes('@tabler/icons')) {
              return 'icons-vendor';
            }
            if (id.includes('@tiptap') || id.includes('prosemirror')) {
              return 'editor-vendor';
            }
            if (id.includes('pdf-lib') || id.includes('pdfmake') || id.includes('jszip') || 
                id.includes('@tonaljs') || id.includes('uuid') || id.includes('dexie') || 
                id.includes('appwrite')) {
              return 'utils-vendor';
            }
            if (id.includes('zod') || id.includes('dompurify')) {
              return 'validation-vendor';
            }
            return 'vendor';
          }
          
          // App chunks
          if (id.includes('src/pages/')) {
            return 'pages';
          }
          if (id.includes('Modal') || id.includes('src/components/UnifiedImportModal') || 
              id.includes('src/components/ExportModal') || id.includes('src/components/BatchImportModal')) {
            return 'modals';
          }
          if (id.includes('src/components/')) {
            return 'components';
          }
          if (id.includes('src/utils/')) {
            return 'utils';
          }
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
