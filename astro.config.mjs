// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://rentbuyatlas.com',
  trailingSlash: 'always',
  integrations: [react()],
  build: { format: 'directory' },
});
