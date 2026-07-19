import { defineConfig } from 'vite';

// mobills.io is served via a GitHub Pages custom domain (see public/CNAME),
// so the site is hosted at the domain root.
export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
