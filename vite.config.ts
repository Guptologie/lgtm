import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// `vite` serves the standalone dev harness (root index.html); `vite build`
// produces the ESM library. Host-provided deps are externalized.
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.tsx'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react-dom/client',
        'zustand',
        '@ghpp/domain',
        /^@primer\//,
        /^@dnd-kit\//,
      ],
    },
  },
  test: {
    environment: 'node',
  },
});
