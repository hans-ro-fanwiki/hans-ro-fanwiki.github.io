import { defineConfig } from 'vite';

const contentSecurityPolicy = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: https://ro.hans-webgametw.com",
  "connect-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

export default defineConfig({
  base: './',
  define: {
    // Freeze the release build time; never advance it on a visitor's reload.
    'import.meta.env.VITE_WIKI_UPDATED_AT': JSON.stringify(new Date().toISOString()),
  },
  plugins: [{
    name: 'wiki-browser-policy',
    apply: 'build',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html.replace(/<meta charset="UTF-8"\s*\/?>/i, charset =>
          `${charset}<meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy}"><meta name="referrer" content="no-referrer">`);
      },
    },
  }],
  build: {
    outDir: 'dist',
    rollupOptions: {input: {wiki: 'index.html'}},
  },
});
