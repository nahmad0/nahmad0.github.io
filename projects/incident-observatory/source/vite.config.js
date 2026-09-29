import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [{
    name: 'production-content-policy',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(' ws://127.0.0.1:4174', '');
    },
  }],
});
