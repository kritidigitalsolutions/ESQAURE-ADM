# Project Rules & Design Guidelines (ESQUARE Admin)

## Website Theme & Visual Identity

- **Theme Accent Color**: `#FEF08A` (Light Pastel Yellow / Amber)
- **Dark Mode Background**: `#080B08` / `#111111` (Deep dark slate/charcoal, avoiding pure `#000000` to prevent eye strain and preserve depth)
- **Font**: Urbanist (`font-urbanist`, `font-sans`)

---

## Material Design Dark Theme Architecture (UI Application Standard)

Following the [Material Design Dark Theme Guidelines](https://m2.material.io/design/color/dark-theme.html#ui-application):

### 1. Dark Surfaces & Depth Hierarchy
- **No Pure Black for Surfaces**: Never use `#000000` as the surface fill of UI containers, cards, tables, or modals. Pure black eliminates drop shadows and causes severe contrast vibration/glare.
- **Elevation via Surface Lightness**: In dark theme, higher elevation is communicated by **lighter surface tones** (simulating proximity to an ambient light source) rather than relying solely on shadows:
  - **Level 0 (Canvas / Base Background)**: `#080B08` / `#0C0F0C` (0% overlay)
  - **Level 1 (Cards, Metric Containers, Table Rows)**: 5% overlay (`bg-[#121612]` or `bg-slate-900/60`, border `border-white/10`)
  - **Level 2 (Hovered Cards, Secondary Containers)**: 7% overlay (`bg-[#161B16]`)
  - **Level 4 (App Bar, Top Navigation, Sticky Headers)**: 9% overlay (`bg-[#1A1F1A]/95 backdrop-blur-md`, `border-b border-white/10`)
  - **Level 8 (Dropdown Menus, Popovers, Filter Menus)**: 12% overlay (`bg-[#202620]`, shadow-lg, border `border-white/12`)
  - **Level 16 (Slide-over Drawers, Side Panels)**: 15% overlay (`bg-[#242A24]`, shadow-xl)
  - **Level 24 (Modal Dialogs, Alert Prompts)**: 16% overlay (`bg-[#282E28]`, shadow-2xl, border `border-white/15`)
- **Preserve Depth Shadows**: Always retain natural cast shadows (`shadow-md`, `shadow-xl`, `shadow-2xl`) along the z-axis. Never replace shadows with colored glowing outlines.

### 2. Typography & "On-Surface" Color Hierarchy
Ensure full compliance with WCAG AA (≥ 4.5:1 body text, ≥ 15.8:1 white-on-dark surface):
- **High-Emphasis Text & Critical Icons**: 87% to 92% White (`text-white/90` or `text-slate-100`)
- **Medium-Emphasis Text / Secondary Labels**: 60% White (`text-white/60` or `text-slate-400`)
- **Disabled Text / Placeholder / De-emphasized Hints**: 38% White (`text-white/38` or `text-slate-500` / `text-slate-600`)
- **Borders & Dividers**: 10%–12% White (`border-white/10` or `border-white/12`)

### 3. Limited & Desaturated Accent Colors
- **Restraint**: Saturated colors vibrate and tire the eyes against dark backgrounds. Dark surfaces must dominate 90%+ of the screen.
- **Brand Accent (#FEF08A)**: Use light pastel yellow strictly for focal points:
  - Primary CTA buttons (`bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-bold`)
  - Active navigation pill or tab indicator
  - Selected table rows / active filters
  - KPI metric icon badges
- **Do Not Tint Large Surfaces**: Never fill entire panels or large cards with solid `#FEF08A`. Keep surfaces dark and accent with icons, badges, and text highlights.

### 4. Interactive States in Dark Mode
- **Hover**: Subtle white overlay increase (+5% to +8% lightness, e.g., `hover:bg-white/[0.05]`)
- **Focus**: Distinct focus ring (`focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/60`)
- **Active / Pressed**: +12% lightness overlay or solid theme accent.

---

## Icon & KPI Card Styling Standard

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
