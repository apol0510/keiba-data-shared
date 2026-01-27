import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://keiba-data-shared.netlify.app/',
  output: 'static', // 完全静的サイト（adapterは不要）
  server: {
    port: 4321
  }
});
