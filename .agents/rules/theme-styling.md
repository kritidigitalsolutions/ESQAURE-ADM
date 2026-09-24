---
description: Enforce Material Design 2 Dark Theme architecture and uniform #FEF08A theme color across ESQUARE Admin
trigger: always_on
---

# UI Theme & Dark Mode Styling Guidelines

## 1. Theme Identity & Core Palette
- **Primary Website Theme Accent**: `#FEF08A` (Light Pastel Yellow)
- **Primary Hover State**: `#FDE047`
- **Dark Mode Base Background**: `#080B08` / `#111111` (Deep dark slate, never pure `#000000` for surface fills)
- **Typography**: Urbanist (`font-urbanist`, `font-sans`)

---

## 2. Material Design Dark Theme Architecture (Elevation & Surfaces)

Following [Material Design 2: Dark Theme (UI Application)](https://m2.material.io/design/color/dark-theme.html#ui-application):

### Surface Elevation Hierarchy
In dark mode, components communicate elevation by **displaying lighter surface colors** (higher components are closer to the light source), while retaining natural drop shadows for depth:

| Elevation Level | Component Examples | Surface Treatment |
|---|---|---|
| **00dp (Base Canvas)** | Main layout background | `#080B08` / `#0C0F0C` (0% overlay) |
| **01dp (Base Surface)** | KPI Cards, Table rows, Input containers | `bg-[#121612]` or `bg-slate-900/60`, border `border-white/10` (5% overlay) |
| **02dp (Elevated Card)** | Hovered cards, Secondary metric widgets | `bg-[#161B16]`, subtle shadow (7% overlay) |
| **04dp (App Bar)** | Top Navigation, Sticky Page Headers | `bg-[#1A1F1A]/95 backdrop-blur-md`, `border-b border-white/10` (9% overlay) |
| **08dp (Menus & Sheets)** | Dropdown menus, Popovers, Filter panels | `bg-[#202620]`, `shadow-lg`, `border border-white/12` (12% overlay) |
| **16dp (Drawers)** | Slide-over drawers, Side sheets | `bg-[#242A24]`, `shadow-xl`, `border-l border-white/12` (15% overlay) |
| **24dp (Modals)** | Dialogs, Confirmation popups | `bg-[#282E28]`, `shadow-2xl`, `border border-white/15` (16% overlay) |

### Strict Surface Principles:
1. **Never use pure `#000000`** as a component surface; pure black hides shadows and produces harsh glare against white text.
2. **Never replace drop shadows with colored glowing outlines**. Retain standard z-axis shadows.
3. **Do not apply white overlays to primary-colored surfaces**.

---

## 3. Typography & "On-Surface" Contrast Rules (WCAG AA)
- **High-Emphasis Text & Critical Icons**: 87%–92% White (`text-white/90` or `text-slate-100`) — Contrast ratio ≥ 15.8:1 against dark surfaces.
- **Medium-Emphasis Text & Secondary Labels**: 60% White (`text-white/60` or `text-slate-400`) — Meets 4.5:1 requirement.
- **Disabled Text & Placeholders**: 38% White (`text-white/38` or `text-slate-500` / `text-slate-600`).
- **Dividers & Structural Borders**: 10%–12% White (`border-white/10` or `border-white/12`).

---

## 4. Brand Accent Color Restraint
- **Dark surfaces must occupy 90%+ of the screen**. Saturated surfaces vibrate and cause visual fatigue in dark mode.
- Use `#FEF08A` as a laser-focused accent:
  - Primary action buttons: `bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-bold`
  - Active navigation pill / selected tab indicator
  - KPI metric icon badges
  - Table selection highlights / active status tags

---

## 5. Icon & KPI Card Styling Standard

Whenever creating or modifying KPI cards, stat cards, metric overviews, or feature cards in this project:

1. **Uniform Icon Styling**:
   - **Do NOT** use rainbow/multi-colored backgrounds (e.g., green, orange, purple, blue) for icons across metric cards.
   - **Always** use the primary website theme color (`#FEF08A`) consistently for all card icon badges.

2. **Standard KPI Metric Icon Badge**:
   ```jsx
   <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 group-hover:scale-105 transition-transform shadow-xs">
     <Icon className="w-5 h-5 text-slate-950 dark:text-amber-400 stroke-[2.2]" />
   </div>
   ```

3. **Standard Modal / Header Icon Badge (compact)**:
   ```jsx
   <div className="w-8 h-8 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0">
     <Icon className="w-4 h-4 stroke-[2.2]" />
   </div>
   ```

4. **Action Buttons / Active Indicators**:
   - Primary action buttons, active tab indicators, and search highlights should use `bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-bold`.
