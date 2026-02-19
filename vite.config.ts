import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: If you change the repository name, also update:
// - src/config.ts (APP_CONFIG.basePath)
const REPO_NAME = 'profiles-with-agcd';

export default defineConfig({
  plugins: [react()],
  base: `/${REPO_NAME}/`,
})
