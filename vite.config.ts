import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Output directory
    outDir: 'dist',
    
    // Generate sourcemaps for debugging
    sourcemap: false,
    
    // Optimize bundle size with esbuild (faster than terser)
    minify: 'esbuild',
    
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    
    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'convex-vendor': ['convex'],
        },
      },
    },
  },
  
  // Server configuration for development
  server: {
    port: 5173,
    host: true, // Listen on all addresses
    open: true, // Open browser on start
  },
  
  // Preview configuration
  preview: {
    port: 4173,
    host: true,
  },
})
