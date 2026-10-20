# Mobile UI Principles — Thumb Zones, Ergonomics & Spacing

**What it is:** Cross-platform ergonomics rules for mobile UI. Load this alongside any platform skill (SwiftUI, Material 3, Expo) to enforce touch-friendly design.

## The Core Insight

Most mobile UIs are designed on desktops, by people using mice. The result is controls that are technically tappable but painful in practice — tiny touch targets, important actions at the top of the screen, navigation that requires a two-handed grip.

This skill forces Claude to design for the thumb, held in one hand.

## Install Options

**Option 1: Find a community skill**
```bash
# Search the awesome-claude-skills list for mobile UI
# https://github.com/travisvn/awesome-claude-skills
claude plugin add travisvn/awesome-claude-skills
```

**Option 2: Write a custom SKILL.md here**  
The principles below are comprehensive enough to use as the basis of a SKILL.md. Drop one in this folder when you've written or found the right file.

**Option 3: Embed in your project CLAUDE.md**  
Add the principles below to your project's `CLAUDE.md` as standing instructions for mobile UI work.

---

## Principles Reference (use as SKILL.md content or CLAUDE.md rules)

### Thumb Zone Map

```
┌─────────────────┐
│  ████████████   │  ← Hard reach (top 35%) — critical actions NEVER here
│  ████████████   │     Reserve for: page titles, status, non-interactive chrome
├─────────────────┤
│                 │  ← Stretch zone (middle 30%) — secondary actions OK
│  ○  ○  ○  ○  ○  │     Reserve for: secondary CTAs, filter options
├─────────────────┤
│                 │  ← Natural zone (bottom 35%) — primary actions GO HERE
│  [  PRIMARY  ]  │     Primary CTA, tab bar, main navigation
└─────────────────┘
```

67% of users navigate with their right thumb. Design assuming one-handed, right-thumb use as the default.

### Touch Target Sizing

| Platform | Minimum | Recommended |
|----------|---------|-------------|
| iOS (HIG) | 44×44 pt | 48×48 pt |
| Android (MD3) | 48×48 dp | 56×56 dp |
| Web/PWA (WCAG 2.5.5) | 44×44 CSS px | 48×48 CSS px |

Rules:
- The **visual** element can be smaller; pad the **hit area** to minimum size
- Space between adjacent tap targets: minimum 8px
- Never place two tappable elements within 8px of each other without a separator

### Navigation Placement

**Bottom navigation** (tab bar) is the standard for mobile apps with 3–5 top-level destinations:
- Place at the very bottom of the screen (above home indicator on iOS)
- Icon + label for all tabs (not icon-only unless you have severe space constraints)
- Active tab must be visually distinct

**Top navigation** (app bar) is for:
- Back button / close
- Screen title
- Secondary contextual actions (share, filter, overflow)

**Never put primary CTAs in the top app bar.** Primary actions live at the bottom or inline with content.

### Safe Areas

Always account for device safe areas:
- **iOS**: Home indicator (34pt bottom), notch/Dynamic Island (top varies by device)
- **Android**: System navigation bar, status bar

In code:
- **SwiftUI**: `.safeAreaInset(edge:)`, `.ignoresSafeArea(.container, edges: .bottom)`
- **React Native / Expo**: `react-native-safe-area-context` → `SafeAreaView`
- **Flutter**: `MediaQuery.of(context).padding`

### Spacing System — 8dp Grid

Use multiples of 8dp for all spacing:
- Margin between screen edge and content: **16dp** (minimum), **24dp** (comfortable)
- Spacing between list items: **8dp** (compact), **16dp** (standard)
- Section padding: **24dp** vertical, **16dp** horizontal
- Button height: **48dp** (touch-friendly minimum)
- Card padding: **16dp** all sides

Never use arbitrary spacing values. Multiples of 4dp are acceptable for fine-tuning within components.

### List & Scroll Behavior

- Infinite scroll: show a loading indicator at the bottom, not a "Load more" button
- Pull-to-refresh: standard gesture — don't build a custom one
- Sticky headers: use sparingly — they consume vertical space on small screens
- List items with actions: swipe-to-reveal (iOS standard), long-press menu (Android standard)

### Forms on Mobile

- One input per viewport height when possible
- Keyboard type matters: set `keyboardType` to `emailAddress`, `phonePad`, `numberPad`, etc.
- Show "Next" button in keyboard toolbar to move between fields
- Input labels above fields, not inside (placeholder text disappears on focus)
- Large submit button at the bottom, full-width or nearly so

### Typography Minimums

| Text role | Minimum size |
|-----------|-------------|
| Body text | 16sp / 16pt |
| Secondary text | 14sp / 14pt |
| Caption / label | 12sp / 12pt (sparingly) |
| Never | < 11sp / 11pt |

Line height: 1.4–1.6× font size for body text. Tight line-height feels cramped on mobile.

### Modal & Sheet Patterns

- **Bottom sheet** (preferred for mobile): slides up from bottom, naturally in thumb reach
- **Full-screen modal**: for complex flows (multi-step forms, cameras, pickers)
- **Alert dialog**: for critical confirmations only — don't use for informational content
- Avoid centered modals on mobile — they're harder to dismiss and feel out of place

---

## Integration with Other Skills

**With `swiftui`:** These principles align with Apple's Human Interface Guidelines. SwiftUI's built-in components (NavigationStack, TabView, List) respect safe areas by default — don't override unless intentional.

**With `material-3`:** MD3's adaptive layout system and 8dp spacing grid are built on these same principles. Material's navigation bar component is already bottom-positioned.

**With `expo`:** React Native requires explicit safe area handling. Always use `react-native-safe-area-context`. Expo's built-in navigation (Expo Router) handles this automatically.

**With `ui-ux-pro-max`:** When generating a design system for mobile, specify the platform in your prompt. The skill outputs platform-appropriate spacing and component sizes.
