---
name: Pynn Pridi 37 — Manga 2D Blueprint & Comic Cel
description: Technical architectural blueprint meets 2D graphic comic cel design system with comfortable looped Thai typography.
colors:
  ink-primary: "#11141a"
  ink-secondary: "#475569"
  ink-muted: "#64748b"
  canvas-bg: "#f8fafc"
  paper-surface: "#ffffff"
  pop-cyan: "#00f0ff"
  pop-yellow: "#ffe600"
  pop-green: "#10b981"
  pop-red: "#ff2a5f"
  pop-coral: "#ea580c"
  pop-blue: "#0284c7"
typography:
  display:
    fontFamily: "Bangers, cursive, Prompt, sans-serif"
    fontWeight: 700
  body:
    fontFamily: "Sarabun, TH Sarabun New, -apple-system, sans-serif"
    fontWeight: 400
    lineHeight: 1.55
  mono:
    fontFamily: "Space Mono, JetBrains Mono, monospace"
    fontWeight: 400
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  manga-card:
    backgroundColor: "{colors.paper-surface}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.md}"
    padding: "20px"
  button-primary:
    backgroundColor: "{colors.pop-cyan}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-success:
    backgroundColor: "{colors.pop-green}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-danger:
    backgroundColor: "{colors.pop-red}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
---

# DESIGN.md — Manga 2D Blueprint & Comic Cel Edition

## Overview
A high-precision technical interface designed for tracking 93 piles and construction quality control at Pynn Pridi 37. Combines the razor-sharp clarity of engineering blueprints with the bold visual identity of 2D comic art and manga aesthetics.

## Colors
- **Canvas & Ink**:
  - `canvas-bg` (`#f8fafc`): Dot screentone paper canvas.
  - `paper-surface` (`#ffffff`): High-contrast card surfaces.
  - `ink-primary` (`#11141a`): Solid black line art for borders, texts, and block shadows.
  - `ink-secondary` (`#475569`): Muted technical metadata and captions.
- **Semantic Pops**:
  - `pop-green` (`#10b981` / `#05ffa1`): Driven piles, completed steps, passed QA.
  - `pop-yellow` (`#ffe600` / `#f59e0b`): In-progress operations, pending reviews, active selection.
  - `pop-red` (`#ff2a5f` / `#f43f5e`): Defects, tolerance alerts, critical stops.
  - `pop-cyan` (`#00f0ff` / `#0284c7`): 3D CAD raycasting, coordinates, target pile markers.
  - `pop-coral` (`#ea580c`): Brand highlights and milestone actions.

## Typography
- **Formal Body & Tables (ฟอนต์ไทยมีหัว อ่านสบายตา)**:
  - Font: `'Sarabun', 'TH Sarabun New', -apple-system, sans-serif`
  - Purpose: Body text, tables, status badges, forms, and technical documentation. Provides effortless legibility for numbers and construction specifications without eye fatigue.
- **Hero Numbers & Titles**:
  - Font: `'Bangers', cursive, 'Prompt', sans-serif`
  - Purpose: Impactful comic-book KPI counters, hero headlines, and milestone tags.
- **Telemetry & Dimensions**:
  - Font: `'Space Mono', 'JetBrains Mono', monospace`
  - Purpose: Coordinates (X, Y, Z), cut-off levels, millimeter deviation metrics.

## Layout
- Grid-based engineering dashboards with 20px screentone dots (`manga-screentone-bg`).
- Floating HUD consoles and docked toolbars with clear physical separation.

## Elevation & Depth
- **Zero-Blur Block Shadows**:
  - Subtle: `2px 2.5px 0px #11141a`
  - Standard Card: `4px 4px 0px #11141a`
  - Hero Highlight: `6px 6px 0px #11141a, 10px 10px 0px rgba(17, 20, 26, 0.12)`
- Strict tactile physics: Hover shifts `-1.5px, -1.5px` and expands shadow; Active click presses down `+2px, +2px` with shadow collapsing to `0.5px`.

## Shapes
- Crisp ink borders: `2px` to `3.5px solid #11141a`.
- Snappy rounded corners: `6px` to `12px` ensuring a structured comic frame feel.

## Components
- **Manga Cards**: White paper background, 2.5px ink border, 4px block shadow.
- **Tactile Buttons**: High-energy pop colors with physical click depression.
- **Status Badges & Chips**: Slanted and bordered badge tags with high-contrast text.
- **Tabular Lining Figures**: All pile numbers and measurement cells use `tabular-nums lining-nums`.

## Do's and Don'ts
- **DO**:
  - Always use `'Sarabun'` for long paragraphs, form inputs, table data, and inspector panels.
  - Keep borders crisp black (`#11141a`).
  - Use zero-blur solid drop shadows for authentic 2D pop art feel.
- **DON'T**:
  - Do NOT use blurry CSS box-shadows or generic gradient drop-shadows.
  - Do NOT use loopless modern sans-serif fonts for data tables when Sarabun is specified.
  - Do NOT mix low-contrast pastel gray borders with comic elements.
