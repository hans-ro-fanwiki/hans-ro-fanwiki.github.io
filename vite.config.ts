import { defineConfig } from 'vite';
// Private development art is copied into the gitignored dist/ directory only by
// an explicit local-only script; no bundled art is included in GitHub CI builds.
export default defineConfig({base:'./',build:{outDir:'dist',rollupOptions:{input:{wiki:'index.html',rankPreview:'520520520/index.html'}}}});
