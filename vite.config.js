import path from "path"
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

   resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // ADD THIS SERVER CONFIGURATION
  server: {
    proxy: {
      // string shorthand for simple cases
      '/api': {
        // This is the address of your backend server
        target: 'https://leading-unity-backend.vercel.app',
        changeOrigin: true,
        secure: false,      
      },
    }
  }
})