import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // Output to dist/ for Docker COPY
    outDir: 'dist',
    // Generate source maps for debugging
    sourcemap: false,
  },
  // Dev server settings
  server: {
    port: 8080,
  },
});
