---
name: Pynn Pridi 37 — Rectilinear Architectural Manga
description: Precision architectural blueprint meets 2D graphic comic cel design system with sharp 90-degree corners, zero border-radius, and harmonious eye-comfortable palette.
colors:
  ink-primary: "#0f172a"
  ink-secondary: "#475569"
  ink-muted: "#64748b"
  canvas-bg: "#f8fafc"
  paper-surface: "#ffffff"
  harmonic-green: "#059669"
  harmonic-green-soft: "#f0fdf4"
  harmonic-amber: "#d97706"
  harmonic-amber-soft: "#fffbeb"
  harmonic-red: "#dc2626"
  harmonic-red-soft: "#fef2f2"
  harmonic-blue: "#2563eb"
  harmonic-blue-soft: "#eff6ff"
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
  all: "0px"
shadows:
  xs: "1.5px 1.5px 0px #0f172a"
  sm: "2px 2px 0px #0f172a"
  md: "3px 3px 0px #0f172a"
  lg: "4.5px 4.5px 0px #0f172a"
  xl: "6px 6px 0px #0f172a"
---

# DESIGN.md — Rectilinear Architectural Manga Edition

## Overview
A high-precision technical interface designed for tracking 93 piles and construction quality control at Pynn Pridi 37. Inspired by Japanese technical architectural manga and mechanical CAD drafting. Featuring 100% sharp rectilinear geometry (zero curves, no rounded corners), crisp 2px solid charcoal ink lines, and an eye-comfortable harmonious color palette.

## Core Visual Philosophy
- **Sharp Rectilinear Geometry (เหลี่ยม 100% ไร้ความโค้งมน)**:
  - All cards, buttons, modals, input fields, badges, and headers feature crisp right angles (`border-radius: 0px`).
  - Eliminates generic rounded-corner "AI template" aesthetics in favor of authoritative, engineered architectural precision.
- **Eye-Comfortable Harmonious Palette (ชุดคู่สีที่สบายตาลงตัว)**:
  - Replaces harsh blinding neons with rich, grounded engineering tones paired with soft vellum tints.
  - **Green Harmonic (Done / Passed)**: Emerald `#059669` + Mint Vellum `#f0fdf4` + Forest Ink `#064e3b`.
  - **Amber Harmonic (In Progress / PCO / Plan / Report)**: Ochre Amber `#d97706` + Warm Linen `#fffbeb` + Umber Ink `#78350f`.
  - **Red Harmonic (Over Tolerance / Defect / Alert)**: Persimmon Crimson `#dc2626` + Soft Blush `#fef2f2` + Wine Ink `#991b1b`.
  - **Blue Harmonic (3D CAD / Coordinates / Viewports)**: Blueprint Cobalt `#2563eb` + Ice Blueprint `#eff6ff` + Navy Ink `#1e3a8a`.
  - **Canvas & Ink**: Architectural drafting paper `#f8fafc` + Crisp pure white `#ffffff` + Solid Slate Charcoal Ink `#0f172a`.

## Typography
- **Formal Body & Tables**: `'Sarabun', 'TH Sarabun New', sans-serif` for comfortable, fatigue-free reading of engineering specifications, numbers, and construction reports.
- **Big Display KPIs**: `'Bangers', cursive, 'Prompt'` for impactful, unmistakable milestone counters.
- **Coordinates & Dimensions**: `'Space Mono', monospace` with tabular lining numbers.

## Elevation & Tactile Physics
- **Zero-Blur Block Shadows**: Solid `#0f172a` ink block drops (`3px 3px 0px #0f172a`).
- **Tactile Physics**:
  - `hover`: Translate `-1.5px, -1.5px`, shadow expands to `4.5px 4.5px 0px`.
  - `active`: Translate `+2px, +2px`, shadow collapses to `0.5px 0.5px 0px`.

## Mobile Ergonomics & Field Usability (ออกแบบเพื่อการใช้งานหน้างานผ่านมือถือ)
- **Bottom Sheet Drawer (`#pile-card`)**:
  - Replaces screen-blocking centered floating modals with an ergonomic bottom drawer sliding up from screen bottom on mobile (`max-height: 72vh`, `border-radius: 16px 16px 0 0`).
  - Keeps the 3D model visible above the card so the site engineer can see both the pile in 3D and the entry fields simultaneously.
  - Generous touch targets ($\ge 44$px) for numeric input (Actual TOP, Actual N, Actual E) with clear step helpers (`-1cm`, `+1cm`, `-5cm`, `+5cm`).
  - Full-width, prominent "✓ บันทึกกดเสร็จ" button with tactile press state.
- **Collapsible Floating HUD**:
  - Large desktop floating menu auto-collapses into a single floating button `[☰ เมนู 3D]` on viewports $\le 768$px, freeing up over 60% of screen estate for smooth orbit and pan navigation.
- **One-Hand Bottom Thumb Bar**:
  - Quick action buttons fixed at the bottom of the viewport (`[⌖ กึ่งกลาง]` and `[⊞ 93 ต้น]`) for instant camera repositioning using one hand on site.

## Inter-Page Navigation Architecture (ระบบลิงก์ข้ามโมดูลแบบ Clean Relative)
- **100% Self-Contained Directory**: All navigation uses strict relative URLs (`index.html`, `piling.html`, `footing.html`).
- **Seamless Module Switching**:
  - `index.html` → Portal to 3D Piling (`piling.html?view=3d#3d`), S-Curve Daily Report (`piling.html?view=report#report`), and 3D Footing (`footing.html`).
  - `piling.html` → Symmetrical header switcher to `footing.html` and `index.html`.
  - `footing.html` → Header switcher to `piling.html` and `index.html`.
- **Zero Absolute Paths**: The folder `pridi 37 develop` can be moved, renamed, served on localhost, or deployed to GitHub Pages without any broken links.

