# UI UX Pro Max

**Source:** https://github.com/nextlevelbuilder/ui-ux-pro-max-skill  
**By:** nextlevelbuilder  
**What it is:** A reasoning engine that analyzes your project type and auto-generates a complete, industry-matched design system — colors, typography, UI style, layout pattern, animations, anti-patterns to avoid, and a pre-delivery checklist.

## What Makes This Different

Instead of you guessing the right design direction, UI UX Pro Max runs 5 parallel searches across its database:

- 161 product categories (SaaS, beauty spa, fintech, gaming, etc.)
- 67 UI styles (Glassmorphism, Brutalism, Bento Grid, AI-Native, etc.)
- 161 color palettes (industry-specific, not generic)
- 57 font pairings (with ready Google Fonts imports)
- 25 chart types, 99 UX guidelines, 15 tech stack rules

The output is a structured design system you feed into `frontend-design` as your token baseline.

## Install

**Option 1: Claude Code plugin marketplace (recommended)**
```bash
claude plugin add nextlevelbuilder/ui-ux-pro-max-skill
# then inside your project:
claude plugin install ui-ux-pro-max@ui-ux-pro-max-skill
```

**Option 2: npm CLI**
```bash
npm install -g uipro-cli
cd /path/to/your/project
uipro init --ai claude
```

**Option 3: Global install (available across all projects)**
```bash
npm install -g uipro-cli
uipro init --ai claude --global
# installs to ~/.claude/skills/
```

**Prerequisite:** Python 3.x must be installed (`python3 --version` to check).

## Usage

Once installed, just describe your project naturally:

```
Build a landing page for my SaaS product
Create a dashboard for healthcare analytics
Design a portfolio website for a photographer
Make a mobile banking app UI
```

The skill activates automatically for any UI/UX request and generates the design system before writing code.

### Specify Your Stack

Add your tech stack to the prompt for stack-specific guidance:

```
Build a landing page for my SaaS product using shadcn/ui and Next.js
Design a mobile app UI for iOS using SwiftUI
Create an e-commerce site with React and Tailwind
```

Supported stacks: React, Next.js, Vue, Nuxt, shadcn/ui, Angular, Svelte, Astro, SwiftUI, Jetpack Compose, React Native, Flutter, HTML+Tailwind, Laravel.

### Advanced: Run the Design System Generator Directly

After install, you can call the search engine from the terminal:

```bash
# Generate a design system for your project
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "beauty spa wellness" --design-system -p "Serenity Spa"

# Generate with Markdown output (good for saving to file)
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "fintech banking" --design-system -f markdown

# Search specific domains
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "glassmorphism" --domain style
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "elegant serif" --domain typography
```

### Persist the Design System Across Sessions

```bash
# Save to design-system/MASTER.md — survives context resets
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "SaaS dashboard" --design-system --persist -p "MyApp"
```

This creates `design-system/MASTER.md` as the source of truth for your project's tokens. Reference it in any future prompt: "Read design-system/MASTER.md before building this component."

## Integration with Other Skills

**With `frontend-design`:**  
Run `ui-ux-pro-max` first to generate the design system (colors, fonts, style). Then tell `frontend-design`: "Use this color palette and typography as the token system. Add a signature element."

**With `shadcn-ui`:**  
Specify `shadcn/ui` in your stack prompt. The skill outputs shadcn-compatible token values. Feed those into your `tailwind.config.js`.

**With `dashboard`:**  
Use the "BI/Analytics Dashboard" style options (10 dashboard styles available). The skill picks the right chart types for your data type.

**With `gsap`:**  
The "Key Effects" section of the design system output tells you what motion the design calls for. Hand that to `gsap` as the animation brief.

## Taste Presets

Don't stack all styles at once. Pick one per project:

| Preset | Best for |
|--------|----------|
| **Minimalist** | SaaS, docs, B2B tools |
| **Brutalist** | Portfolios, agencies, Gen Z brands |
| **Premium** | Luxury, fintech, high-end e-commerce |
| **All-Rounder** | Consumer apps, marketplaces |

Add the preset name to your prompt: "Design a fintech app, Premium aesthetic."
