import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Importe o plugin

// https://vitejs.dev/config/
export default defineConfig({
  // Adicione o plugin aqui
  plugins: [react(), tailwindcss()],
})
