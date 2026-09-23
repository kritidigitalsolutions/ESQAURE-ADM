---
description: Enforce website theme color (#FEF08A) for icon badges, KPI cards, and interactive elements across ESQUARE Admin
trigger: always_on
---

# UI Theme & Icon Styling Guidelines

## Theme Identity
- **Website Theme Color**: `#FEF08A` (Yellow accent)
- All card icon badges in stat and metric cards must use this theme color instead of arbitrary disparate colors (avoid multi-color schemes like green, orange, purple).

## Card Icon Badges
Always format KPI / stat card icons as:
```jsx
<div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 group-hover:scale-105 transition-transform shadow-xs">
  <Icon className="w-5 h-5 text-slate-950 dark:text-amber-400 stroke-[2.2]" />
</div>
```

## Modal & Header Icons
For smaller header badges:
```jsx
<div className="w-8 h-8 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0">
  <Icon className="w-4 h-4 stroke-[2.2]" />
</div>
```
