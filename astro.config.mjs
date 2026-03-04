import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://data.keiba-intelligence.jp/',
  output: 'static', // 完全静的サイト（adapterは不要）
  integrations: [sitemap()],
  server: {
    port: 4321
  }
});
