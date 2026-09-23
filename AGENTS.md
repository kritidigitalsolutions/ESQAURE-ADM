# Project Rules & Design Guidelines (ESQUARE Admin)

## Website Theme & Visual Identity

- **Theme Accent Color**: `#FEF08A` (Light Pastel Yellow / Amber)
- **Dark Mode Background**: `#080B08` / `#111111`
- **Font**: Urbanist (`font-urbanist`, `font-sans`)

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
