---
name: PYNN PRIDI 37 — DoodleWeb Warm Craft Design System
description: Warm editorial craft design system inspired by DoodleWeb, featuring warm cream paper canvas, deep navy ink, vibrant tangerine accents, Fraunces serif typography, and tactile offset shadows with signature orange hover pops.
colors:
  # Canvas & Paper
  canvas-cream: "#FAF5EE"
  canvas-cream-deep: "#F6E9D7"
  paper-white: "#FFFFFF"
  border-soft: "#E2D9CC"
  
  # Deep Ink & Text (Replacing harsh black)
  ink-navy: "#1D2B45"
  ink-secondary: "#3E4B69"
  ink-muted: "#8C9AA8"
  
  # Vibrant Accents
  accent-tangerine: "#F26B2A"
  accent-tangerine-soft: "#FFE8D6"
  accent-tangerine-warm: "#FFF3EB"
  
  # Functional Semantics
  teal-live: "#40C4C4"
  teal-soft: "#E8F8F5"
  teal-ink: "#0E5E57"
  
  gold-kpi: "#F7B844"
  gold-soft: "#FEF3C7"
  gold-ink: "#78350F"
  
  emerald-done: "#10B981"
  emerald-soft: "#D1FAE5"
  emerald-ink: "#064E3B"
  
  coral-alert: "#E64C3C"
  coral-soft: "#FEE2E2"
  coral-ink: "#991B1B"
  
  blueprint-plan: "#3B82F6"
  blueprint-soft: "#EEF4FF"
  blueprint-ink: "#1E3A8A"

typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontWeight: 900
    letterSpacing: "-0.02em"
    lineHeight: 1.05
  body:
    fontFamily: "DM Sans, Prompt, Sarabun, sans-serif"
    fontWeight: 400
    lineHeight: 1.55
  technical:
    fontFamily: "Space Mono, monospace"
    fontWeight: 700
    letterSpacing: "-0.01em"

rounded:
  pill: "9999px"
  squircle-hero: "24px"
  squircle-card: "16px"
  squircle-sm: "12px"
  tag: "8px"

shadows:
  chip: "2px 2px 0px #1D2B45"
  btn: "3px 3px 0px #1D2B45"
  card: "4px 4px 0px #1D2B45"
  hero: "6px 6px 0px #1D2B45"
  hover-orange: "6px 6px 0px #F26B2A"
  hover-orange-btn: "4px 4px 0px #F26B2A"

components:
  button-primary:
    backgroundColor: "{colors.accent-tangerine}"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.pill}"
    padding: "10px 24px"
  button-primary-hover:
    backgroundColor: "#E05A19"
  button-secondary:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.ink-navy}"
    rounded: "{rounded.pill}"
    padding: "8px 20px"
  card-hero:
    backgroundColor: "{colors.paper-white}"
    rounded: "{rounded.squircle-hero}"
    padding: "24px"
  pill-badge:
    rounded: "{rounded.pill}"
    padding: "4px 12px"
---

# DESIGN.md — DoodleWeb Warm Craft Edition

## Overview
A warm, tactile, high-craft design system crafted for the **PYNN PRIDI 37** construction telemetry portal. Inspired directly by the visual identity of **DoodleWeb** ([doodleweb.io](https://doodleweb.io/services/web-design-and-development)), this design system reconciles precision engineering telemetry (93 piles, S-curve analytics, 3D BIM models) with warm editorial elegance, inviting paper textures, friendly squircles, pill badges, and playful tactile physics.

---

## Colors

### 1. Canvas & Paper Surfaces
| Token | Hex Value | Role & Usage |
|---|---|---|
| `--dw-cream` | `#FAF5EE` | Primary warm paper canvas. Replaces cold, clinical `#FFFFFF` void across entire background. |
| `--dw-cream-deep` | `#F6E9D7` | Deep cream tint for table headers, active tags, and subtle tinted section dividers. |
| `--dw-white` | `#FFFFFF` | Crisp pure white reserved for elevated cards, modal panels, and metric tiles. |
| `--dw-border-soft` | `#E2D9CC` | Warm paper grid line for table internal cells and non-intrusive card dividers. |

### 2. Ink & Structure (Deep Navy แทนสีดำสนิท)
| Token | Hex Value | Role & Usage |
|---|---|---|
| `--dw-navy` | `#1D2B45` | Primary structural ink. Used for all card borders (`2px solid`), solid drop shadows, and main text. |
| `--dw-navy-secondary` | `#3E4B69` | Subtitle text, explanatory captions, metadata labels. |
| `--dw-navy-muted` | `#8C9AA8` | Subtle table sub-headers (`DATE`, `ACTUAL`), hints, inactive states. |

### 3. Signature Accent Palette
| Accent Name | Primary Hex | Soft Surface | Ink / Contrast | Role & Context |
|---|---|---|---|---|
| **Tangerine Orange** | `#F26B2A` | `#FFE8D6` / `#FFF3EB` | `#FFFFFF` / `#C2410C` | **Brand Signature Accent**. Primary CTA buttons, title italics, Today column frame, active progress bar, text selection, and hover drop shadows. |
| **Vintage Teal** | `#40C4C4` | `#E8F8F5` | `#0E5E57` | **Live / Progress Pulse**. Real-time chips, completed piling progress, active sensors. |
| **Marigold Gold** | `#F7B844` | `#FEF3C7` | `#78350F` | **System Status / Highlights**. System online indicator, Total column headers, KPI cards. |
| **Sage Emerald** | `#10B981` | `#D1FAE5` | `#064E3B` | **Passed / Success**. Actual piling count, inspection passed milestones. |
| **Coral Crimson** | `#E64C3C` | `#FEE2E2` | `#991B1B` | **Tolerance Alerts**. Variance warnings, schedule delay indicators, major defect alerts. |
| **Blueprint Blue** | `#3B82F6` | `#EEF4FF` | `#1E3A8A` | **Plan Targets**. Scheduled planned piles, 3D coordinate links, CAD telemetry. |

---

## Typography

### 1. Font Hierarchy
- **Editorial Display**: `'Fraunces', Georgia, serif`
  - High-contrast, warm editorial serif with distinctive human curves.
  - Used for: Brand identity (`PYNN PRIDI 37`), Hero milestone headlines, and primary dashboard greetings.
- **Modern Sans (Body & Controls)**: `'DM Sans', 'Prompt', 'Sarabun', sans-serif`
  - Crisp, legible geometric grotesque with full Thai language support.
  - Used for: Button text, table labels, card copy, dialog instructions.
- **Technical Telemetry**: `'Space Mono', monospace`
  - Monospaced tabular figures.
  - Used for: Pile numbers, percentages, dates, variances, and 3D coordinate values ($X, Y, Z$).

### 2. Typographic Scale
- **Hero Title**: `clamp(2rem, 5vw, 3.75rem)` (32px – 60px), Font Weight 900, Line Height `1.05`, Letter Spacing `-0.02em`.
- **Card Heading**: `1.25rem – 1.5rem` (20px – 24px), Font Weight 800, Line Height `1.2`.
- **KPI Large Number**: `1.875rem – 2.25rem` (30px – 36px), Space Mono / Fraunces, Font Weight 900.
- **Body & Controls**: `0.875rem – 1rem` (14px – 16px), DM Sans / Prompt, Font Weight 500 – 700.
- **Micro Badge / Pill**: `0.65rem – 0.75rem` (10px – 12px), Font Weight 700 – 900, Uppercase.

---

## Layout

- **Warm Paper Canvas Margin**: `padding: 1rem – 2.5rem` (`p-4 md:p-6 lg:p-8`) allowing the paper texture to frame the content without cramped edge bleeding.
- **Responsive Container**: `max-width: 1540px` with centered auto margins (`mx-auto`).
- **Card Stacking Rhythm**: `gap-4 md:gap-6`, with clear visual distinction between Hero Portal Cards and Telemetry Panels.
- **2-Tier Ledger Matrix**: Daily schedule table configured as two 16-day tiers with sticky first column (`left: 0`) and horizonal swipe scroll on tablet/mobile.

---

## Elevation & Depth

Unlike generic blurred drop shadows, DoodleWeb relies on **tactile graphic block shadows** that feel like physical cut paper and stickers:

1. **Card Base Shadow**:
   - `box-shadow: 4px 4px 0px #1D2B45;`
   - Hero Cards: `box-shadow: 6px 6px 0px #1D2B45;`
2. **Buttons & Pills**:
   - Base: `box-shadow: 3px 3px 0px #1D2B45;`
   - Chips: `box-shadow: 2px 2px 0px #1D2B45;`
3. **The Signature Tangerine Hover Pop (DoodleWeb Physics)**:
   - When hovering over interactive cards, buttons, or metric tiles:
     ```css
     transform: translate(-2px, -2px);
     box-shadow: 6px 6px 0px #F26B2A; /* Drops into vibrant orange! */
     ```
   - On Active Press:
     ```css
     transform: translate(2px, 2px);
     box-shadow: 1px 1px 0px #1D2B45;
     ```

---

## Shapes

- **Squircles**: All primary rectangular surfaces have friendly rounded corners:
  - Hero Portal Card: `rounded-3xl` (`24px` / `1.5rem`)
  - Sub-Cards & Metric Tiles: `rounded-2xl` (`16px` / `1rem`)
  - Small Elements / Inputs: `rounded-xl` (`12px` / `0.75rem`)
- **Pills**: All buttons, badges, chips, and live indicators are full pills (`rounded-full` / `9999px`).
- **Zero Raw 0px Angles**: Sharp rectangular 0px borders are eliminated in favor of warm, approachable curves bounded by solid 2px navy ink.

---

## Components

### 1. Hero Portal Card (`.doodle-card-hero`)
- Pure white background (`#FFFFFF`)
- Border: `2.5px solid #1D2B45`
- Radius: `rounded-3xl` (24px)
- Shadow: `6px 6px 0px #1D2B45`

### 2. Primary Hero Action Button (`.doodle-btn-orange`)
- Background: `#F26B2A` (Tangerine Orange)
- Text: `#FFFFFF`, Font Weight 800, DM Sans / Prompt
- Radius: `rounded-full`
- Border: `2px solid #1D2B45`
- Shadow: `4px 4px 0px #1D2B45`
- Hover: Expands to `5px 5px 0px #1D2B45` with `-1px, -1px` translation and arrow icon slide.

### 3. Secondary Pill Button (`.doodle-btn`)
- Background: `#FFFFFF`
- Text: `#1D2B45`, Font Weight 700
- Radius: `rounded-full`
- Border: `2px solid #1D2B45`
- Shadow: `3px 3px 0px #1D2B45`
- Hover: Shifts to Tangerine shadow `hover:shadow-[4px_4px_0px_#F26B2A]`

### 4. Status Chips & Pills (`.doodle-pill`)
- Inline-flex items, `rounded-full`, border `1.5px solid #1D2B45`, shadow `2px 2px 0px #1D2B45`.
- Variants:
  - `.doodle-pill-teal`: Background `#E8F8F5`, text `#0E5E57` + pulsating green dot.
  - `.doodle-pill-gold`: Background `#FEF3C7`, text `#78350F`.
  - `.doodle-pill-orange`: Background `#FFE8D6`, text `#C2410C`.

### 5. Metric Tiles (`.doodle-metric-tile`)
- Compact squircle (`rounded-2xl`) with internal padding (`p-3.5`).
- Border: `2px solid #1D2B45`.
- Features smooth CSS transitions for hover lift and orange shadow drop.

### 6. Doodle Annotations (`.doodle-annotation`)
- Handwritten editorial touch with subtle serif italic styling (`Fraunces` italic) in Tangerine Orange (`#F26B2A`) with decorative star (`✦`).

---

## Do's and Don'ts

### ✅ Do's
- **Always use Deep Navy `#1D2B45`** for borders, ink, and drop shadows instead of cold `#000000` or `#0F172A`.
- **Always keep the canvas warm `#FAF5EE`** — cards should feel like paper sheets resting on a warm wooden drafting table.
- **Use Pill buttons (`rounded-full`)** for all action triggers, navigation switches, and chips.
- **Apply the Signature Orange Hover Pop** (`hover:shadow-[...#F26B2A]`) on interactive elements.
- **Pair Fraunces with DM Sans & Space Mono** — this maintains the authentic editorial craft balance.

### ❌ Don'ts
- **Do not use 0px sharp corners** — that belongs to the discarded manga style. Everything in DoodleWeb is softly curved (`rounded-2xl`, `rounded-3xl`, `rounded-full`).
- **Do not use blurry multi-layer box shadows** (`blur-md`, `shadow-xl` with opacity) — DoodleWeb shadows are 100% solid, crisp, and tactile (`x y 0px color`).
- **Do not use cold bright white backgrounds for the entire page** — use `#FAF5EE` as the canvas.
- **Do not use loud neon colors** — keep colors rich, warm, and vintage-tinted.
