import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Relative base works on BOTH the custom domain root (gtmengine.mingma.pro/)
  // AND the default Pages subpath (mingagent.github.io/echo1-gtm-engine/).
  // Safe because this app has no client-side router (no BrowserRouter/HashRouter).
  base: './',
})
