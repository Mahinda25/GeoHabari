# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Marketing/content site for the Geohabari podcast (African tech stories), built with **Astro 5** (server output, deployed on **Vercel**), React islands for interactive UI, and SCSS/Tailwind v4 for styling.

## Commands

```
npm run dev       # astro dev --host
npm run build     # astro build (output: dist/)
npm run preview   # astro preview
npm run astro     # raw astro CLI passthrough (e.g. npm run astro -- check)
```

There is no test suite, linter, or formatter configured in this repo — don't assume `npm test`/`npm run lint` exist.

## Architecture

**Rendering mode**: `output: 'server'` with the `@astrojs/vercel` adapter (see `astro.config.mjs`) — pages are rendered on demand, not statically prebuilt, so API/env access happens per-request at runtime as well as at build time.

**Layouts — only one is live**: `src/layout/Layout.astro` is imported by every page in `src/pages/`. `src/layout/BaseLayout.astro` is a more elaborate SEO-prop-driven layout that is currently unused/dead — don't assume it's wired up.

**Pages are large and mostly self-contained**: `src/pages/*.astro` (e.g. `index.astro`, `episodes.astro`) inline most markup, data-fetching, and page-specific GSAP scroll/animation logic directly in the page file rather than composing many small components. `src/sections/` and the `pages/`-scoped React components (`src/components/pages/`) exist for a few pages (e.g. Events & Partnerships) but this pattern isn't universal — check the actual page file before assuming a section/component exists.

**Data sources, each with a hard fallback so the site never breaks when a service/env var is missing**:
- **Contentful** (`src/utils/contentful.js`) — CMS content (themes, quote cards, upcoming episode). Uses `CONTENTFUL_PREVIEW_TOKEN` in dev and `CONTENTFUL_DELIVERY_TOKEN` in prod. If `CONTENTFUL_SPACE_ID`/token are missing, a dummy client returning empty results is substituted.
- **Buzzsprout** (`src/utils/buzzsprout.js`) — podcast episode data (`BUZZSPROUT_PODCAST_IDENTIFIER`, `BUZZSPROUT_API_TOKEN`), 5-minute in-memory cache. If credentials are missing or a request fails, calls fall back to `src/data/dummy.js`.
- **YouTube Data API v3** (`src/utils/youtube.js`) — latest/most-viewed channel videos (`YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID`). Falls back to hardcoded video objects on missing keys or API failure.

When touching any of these three utils, preserve the try/catch-to-fallback pattern — pages call them with their own additional `try/catch` too, so failures should never surface as a broken page.

**Styling is mixed, by page/section**: legacy pages use scoped `.scss` files per page (`src/styles/{home,about,contact,episodes}.scss`) plus shared partials in `src/styles/partials/` (`_variables.scss`, `_mixins.scss`, `_functions.scss`, `_fonts.scss`, combined via `combined.scss`). Newer/imported UI (shadcn-style components in `src/components/ui/`) uses Tailwind v4 (`globals.css`, `tailwind.config.mjs`, `@tailwindcss/vite`). When editing a page, match whichever styling system it already uses.

**`src/components/ui/`** is a shadcn/ui-derived component library (Radix primitives + `class-variance-authority` + `tailwind-merge`) — treat these as generic building blocks, not page-specific code.

**Client-side interactivity**: GSAP (with `ScrollTrigger`, `SplitText`, `Observer`) drives scroll/hero animations, written directly inside `<script>` blocks in the `.astro` page files. React is used for isolated interactive islands (e.g. `EpisodeGrid`, `Newsletter`, `FeaturedEpisode`, `Topics`), not for whole-page rendering.

**Config**: `src/config/site.js` holds site-wide metadata (name, SEO defaults, social links, podcast categories, contact info) — several fields (analytics IDs, newsletter signup URL) are still placeholders, don't assume they're live.

**Legacy/vestigial code to be aware of**:
- `README.md` describes an earlier Next.js + SCSS implementation; the current codebase is Astro. Don't trust the README's tech-stack description.
- `sentry.{client,server,edge}.config.js` reference `@sentry/nextjs`, which is not in `package.json` — these configs are leftovers from before the Astro migration and are not currently wired into the build.
- `next` is listed in `package.json` dependencies but the project builds/runs via Astro (`npm run dev`/`build` use `astro`, not `next`).

## Environment variables

Required for full (non-fallback) functionality: `CONTENTFUL_SPACE_ID`, `CONTENTFUL_DELIVERY_TOKEN`, `CONTENTFUL_PREVIEW_TOKEN`, `BUZZSPROUT_API_TOKEN`, `BUZZSPROUT_PODCAST_IDENTIFIER`, `BUZZSPROUT_BASE_URL`, `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID`. All are read via `import.meta.env` and all three data-fetching utils degrade gracefully without them (see above), so local dev works without a `.env` file, just with dummy/fallback content.
