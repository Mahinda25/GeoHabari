/** @type {import('tailwindcss').Config} */

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {}
  },
  plugins: [
    // Typography Plugin (optional - uncomment if installed)
    // require('@tailwindcss/typography'),
    
    // Forms Plugin (optional - uncomment if installed)
    // require('@tailwindcss/forms'),
  ],
};