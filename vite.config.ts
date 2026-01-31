import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      'ts3.zocomputer.io',
      'block-app-bwm.zocomputer.io',
      'bwm.zocomputer.io',
      'localhost'
    ],
    host: true,
    port: 5173
  }
})
