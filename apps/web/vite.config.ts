import { fileURLToPath, URL } from 'node:url';
import { copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages serves 404.html for unknown paths. Serving a copy of
// index.html lets TanStack Router handle deep links like /docs/installation.
function spaFallback(): Plugin {
  return {
    name: 'spa-fallback-404',
    closeBundle() {
      const dist = fileURLToPath(new URL('./dist', import.meta.url));
      copyFileSync(join(dist, 'index.html'), join(dist, '404.html'));
    },
  };
}

// mobills.io is served via a GitHub Pages custom domain (see public/CNAME),
// so the site is hosted at the domain root.
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss(), spaFallback()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
