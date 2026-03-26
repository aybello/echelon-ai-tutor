# Echelon AI Tutor — Design Ideas

## Design Approach Options

<response>
<text>
**Idea 1: Technical Precision — Blueprint Minimalism**

- **Design Movement**: Swiss International Typographic Style meets technical documentation
- **Core Principles**: Grid-based precision, monospaced accents, high information density, no decorative noise
- **Color Philosophy**: Near-white slate background (#F1F5F9), deep navy primary (#0F172A), electric blue accent (#1D4ED8), teal secondary (#0F766E). Colors evoke precision instruments and technical authority.
- **Layout Paradigm**: Left-anchored content with a fixed right-panel drawer for AI tutor. Question card takes full vertical focus. Sidebar stats strip on left.
- **Signature Elements**: Monospace formula blocks, numbered step-by-step breakdowns, thin rule dividers
- **Interaction Philosophy**: Every interaction is deliberate — no hover fluff, just clean state transitions
- **Animation**: Slide-in from right for AI panel, fade-up for new questions, pulse for loading dots
- **Typography System**: Sora (700/800) for headers + Sora (400/500) for body, monospace for formulas
</text>
<probability>0.08</probability>
</response>

<response>
<text>
**Idea 2: Academic Dashboard — Warm Institutional**

- **Design Movement**: Editorial design meets academic textbook — warm, authoritative, trustworthy
- **Core Principles**: Warm off-white backgrounds, generous margins, clear visual hierarchy, readable at all sizes
- **Color Philosophy**: Warm cream (#FAFAF7), charcoal text (#1C1917), amber accent (#D97706), forest green for correct (#059669), crimson for wrong (#DC2626)
- **Layout Paradigm**: Centered single-column question flow with floating score sidebar. AI tutor as bottom sheet on mobile, right panel on desktop.
- **Signature Elements**: Ruled lines under section headers, amber highlight bars, serif-accented module labels
- **Interaction Philosophy**: Confidence meter as tactile toggle buttons, answer options as radio-style cards
- **Animation**: Gentle cross-fade between questions, accordion expand for step solutions
- **Typography System**: Playfair Display (700) for question text + DM Sans (400/600) for UI elements
</text>
<probability>0.07</probability>
</response>

<response>
<text>
**Idea 3: Professional SaaS — Clean Dark-Accent**

- **Design Movement**: Modern B2B SaaS — Notion meets Linear meets exam prep tool
- **Core Principles**: Clean white cards on slate background, strong typographic hierarchy, purposeful color coding, zero visual clutter
- **Color Philosophy**: Slate-100 background (#F1F5F9), pure white cards, blue-700 primary (#1D4ED8), teal-700 secondary (#0F766E). Difficulty uses semantic colors (green/amber/red). Confidence meter uses a 5-color spectrum.
- **Layout Paradigm**: Sticky header with score tracker, full-width question card, slide-in AI tutor panel from right that compresses main content
- **Signature Elements**: Gradient logo badge (blue→teal), pill-shaped module/difficulty tags, circular readiness score ring
- **Interaction Philosophy**: Answer options as full-width clickable cards with hover lift, confidence buttons as icon+label tiles
- **Animation**: FadeUp on question entry, SlideIn for AI panel, Shake on incomplete submission, PopIn for alerts
- **Typography System**: Sora (800) for question text + Sora (400/600) for body, Nunito (800) for score numbers
</text>
<probability>0.09</probability>
</response>

## Chosen Approach

**Idea 3: Professional SaaS — Clean Dark-Accent** is selected.

This approach best matches the original design intent while elevating it with proper React component architecture, smooth framer-motion animations, and a polished SaaS aesthetic. The blue/teal gradient brand identity, white card layout, and semantic color system create a trustworthy, professional exam prep experience.
