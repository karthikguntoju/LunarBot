import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensures portability for deployment to subpaths (e.g., GitHub Pages)
  server: {
    port: 3000,
    open: false,
  },
});
