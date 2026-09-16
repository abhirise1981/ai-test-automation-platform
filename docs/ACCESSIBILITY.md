# Accessibility Testing Approach

## Automated coverage (`tests/accessibility/accessibility.spec.ts`)

Uses axe-core via `@axe-core/playwright`, tagged for WCAG 2.0/2.1/2.2
Level AA. Covers what's programmatically detectable:
- Missing/insufficient alt text
- Colour contrast ratios
- Missing or duplicate form labels
- ARIA role/attribute misuse
- Heading order and landmark structure
- Basic keyboard-reachability smoke check (tab-to-interactive-element)

## What automated scanning does NOT cover

Industry estimates put automated tools (axe, Lighthouse, WAVE) at
roughly **30-50% of WCAG success criteria** being programmatically
detectable at all. The rest requires human judgement:

- **Meaningful reading order** for screen readers (NVDA/JAWS/VoiceOver)
- **Keyboard-trap edge cases** in complex widgets (modals, date pickers)
- **Alt text semantic correctness** (axe checks *presence*, not whether
  the text actually describes the image usefully)
- **Cognitive load / plain-language** requirements
- **Focus order** matching visual/logical order in complex layouts

## Advisory vs. hard-fail

`A11Y-01` (homepage) and `A11Y-02` (login form labels) are **hard
assertions** - critical/serious violations block the pipeline.
`A11Y-03` (heading order on a third-party demo page) is **advisory**
because it's common on public sandbox sites and not something this
project controls; it's logged for the report instead of blocking.

## Recommended manual pass (not automated in this repo)

1. Full NVDA (Windows) and VoiceOver (macOS/iOS) pass on the primary
   user journeys (login, search, checkout).
2. Keyboard-only walkthrough of the checkout flow specifically -
   modals and multi-step forms are the highest-risk keyboard-trap
   areas.
3. 200% browser zoom check for reflow/content-loss (WCAG 1.4.10).
