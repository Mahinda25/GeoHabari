// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import playformCompress from '@playform/compress';
import icon from 'astro-icon';
import robotsTxt from 'astro-robots-txt';
import partytown from '@astrojs/partytown';
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: 'https://geohabari.com', // Required for sitemap
  trailingSlash: 'ignore',
  integrations: [
    react(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
    robotsTxt({
      policy: [
        {
          userAgent: '*',
          allow: '/',
          disallow: ['/admin/', '/api/'],
        },
      ],
      sitemap: true,
    }),
    playformCompress({
      CSS: true,
      HTML: true,
      Image: {
        sharp:true,
      },
      JavaScript: true,
    }),
    icon(),
    partytown({
      config: {
        forward: ['dataLayer.push'],
      },
    }),
  ],
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});