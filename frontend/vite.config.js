import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Permite conexões externas na rede
    port: 3000,
    allowedHosts: [
      'laptop-mlm25',        // O nome do teu computador
      'laptop-mlm25.local',  // Suporte para resolução mDNS/Mac/Linux
      '.local',              // Permite qualquer subdomínio local
      'all'                  // Ou podes usar 'all' para permitir qualquer host na rede
    ]
  }
})