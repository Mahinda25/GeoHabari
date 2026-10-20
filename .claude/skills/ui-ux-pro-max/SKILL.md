---
name: ui-ux-pro-max
description: "UI/UX design intelligence for web and mobile. Includes 50+ styles, 161 color palettes, 57 font pairings, 161 product types, 99 UX guidelines, and 25 chart types across 10 stacks (React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind, shadcn/ui, and HTML/CSS). Actions: plan, build, create, design, implement, review, fix, improve, optimize, enhance, refactor, and check UI/UX code. Projects: website, landing page, dashboard, admin panel, e-commerce, SaaS, portfolio, blog, and mobile app. Elements: button, modal, navbar, sidebar, card, table, form, and chart. Styles: glassmorphism, claymorphism, minimalism, brutalism, neumorphism, bento grid, dark mode, responsive, skeuomorphism, and flat design. Topics: color systems, accessibility, animation, layout, typography, font pairing, spacing, interaction states, shadow, and gradient. Integrations: shadcn/ui MCP for component search and examples."
source: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
---

# UI/UX Pro Max - Design Intelligence

Comprehensive design guide for web and mobile applications. Contains 50+ styles, 161 color palettes, 57 font pairings, 161 product types with reasoning rules, 99 UX guidelines, and 25 chart types across 10 technology stacks. Searchable database with priority-based recommendations.

## When to Apply

This Skill should be used when the task involves **UI structure, visual design decisions, interaction patterns, or user experience quality control**.

### Must Use

- Designing new pages (Landing Page, Dashboard, Admin, SaaS, Mobile App)
- Creating or refactoring UI components (buttons, modals, forms, tables, charts, etc.)
- Choosing color schemes, typography systems, spacing standards, or layout systems
- Reviewing UI code for user experience, accessibility, or visual consistency
- Implementing navigation structures, animations, or responsive behavior
- Making product-level design decisions (style, information hierarchy, brand expression)

### Skip

- Pure backend logic development
- Only involving API or database design
- Performance optimization unrelated to the interface
- Infrastructure or DevOps work

## Install

```bash
npm install -g uipro-cli
uipro init --ai claude          # project-level
uipro init --ai claude --global  # global (~/.claude/skills/)
```

## Rule Categories by Priority

| Priority | Category | Impact | Domain |
|----------|----------|--------|--------|
| 1 | Accessibility | CRITICAL | `ux` |
| 2 | Touch & Interaction | CRITICAL | `ux` |
| 3 | Performance | HIGH | `ux` |
| 4 | Style Selection | HIGH | `style`, `product` |
| 5 | Layout & Responsive | HIGH | `ux` |
| 6 | Typography & Color | MEDIUM | `typography`, `color` |
| 7 | Animation | MEDIUM | `ux` |
| 8 | Forms & Feedback | MEDIUM | `ux` |
| 9 | Navigation Patterns | HIGH | `ux` |
| 10 | Charts & Data | LOW | `chart` |

## How to Use This Skill

### Step 1: Generate Design System (ALWAYS START HERE)

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<product_type> <industry> <keywords>" --design-system [-p "Project Name"]
```

Examples:
```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "beauty spa wellness service" --design-system -p "Serenity Spa"
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "SaaS B2B dashboard analytics" --design-system -p "MyApp"
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "fintech banking dark premium" --design-system -p "NeoBank"
```

Output: Pattern + Style + Colors (hex) + Typography (Google Fonts) + Effects + Anti-patterns + Pre-delivery checklist

### Step 2: Persist Design System Across Sessions

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system --persist -p "Project Name"
```

Creates `design-system/MASTER.md` as the source of truth. Reference in future prompts:
> "Read design-system/MASTER.md before building this component."

### Step 3: Domain Searches

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --domain <domain>
```

| Domain | Use For |
|--------|---------|
| `product` | Product type patterns |
| `style` | UI styles (glassmorphism, brutalism, etc.) |
| `color` | Industry-specific palettes |
| `typography` | Font pairings with Google Fonts imports |
| `chart` | Chart type recommendations |
| `ux` | Best practices, anti-patterns, accessibility |
| `landing` | Landing page structure and CTA strategies |
| `react` | React/Next.js performance patterns |

### Step 4: Stack-Specific Guidelines

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --stack <stack>
```

Stacks: `react`, `next`, `shadcn`, `vue`, `nuxt`, `svelte`, `astro`, `swiftui`, `react-native`, `flutter`, `html-tailwind`

## Pre-Delivery Checklist

Before delivering any UI:
- [ ] No emojis as icons — use SVG (Heroicons/Lucide)
- [ ] cursor-pointer on all clickable elements
- [ ] Hover states with smooth transitions (150–300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard nav
- [ ] prefers-reduced-motion respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] Touch targets ≥44×44px
- [ ] No horizontal scroll on mobile

## Available Styles (67)

**General (49):** Minimalism, Neumorphism, Glassmorphism, Brutalism, 3D & Hyperrealism, Vibrant & Block-based, Dark Mode (OLED), Accessible & Ethical, Claymorphism, Aurora UI, Retro-Futurism, Flat Design, Liquid Glass, Motion-Driven, Micro-interactions, Soft UI Evolution, Neubrutalism, Bento Box Grid, Y2K Aesthetic, Cyberpunk UI, Organic Biophilic, AI-Native UI, and more.

**Dashboard (10):** Data-Dense, Heat Map, Executive, Real-Time Monitoring, Drill-Down Analytics, Comparative Analysis, Predictive Analytics, User Behavior Analytics, Financial, Sales Intelligence.

**Landing Page (8):** Hero-Centric, Conversion-Optimized, Feature-Rich Showcase, Minimal & Direct, Social Proof-Focused, Interactive Product Demo, Trust & Authority, Storytelling-Driven.

## Integration with Other Skills

**With `frontend-design`:** Run ui-ux-pro-max first → use its color/type output as the token system in frontend-design.

**With `shadcn-ui`:** Specify `stack: shadcn/ui` in your prompt. Feed token output into `tailwind.config.js`.

**With `dashboard`:** Use its BI/Analytics Dashboard styles when building data screens.

**With `gsap`:** The "Key Effects" section of design system output tells you what motion to implement.
