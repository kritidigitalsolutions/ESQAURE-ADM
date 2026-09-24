import React from 'react';
import { LineChart, BarChart2 } from 'lucide-react';

/**
 * ViewToggle Component - Toggles between curve line view and bar view
 * Styled to match the exact OTT Admin Dashboard toggle design language
 */
export function ViewToggle({ value = 'curve', onChange }) {
  return (
    <div className="pointer-events-auto inline-flex items-center gap-0.5 rounded-xl bg-slate-100/90 dark:bg-[#161B16] p-1 border border-slate-200/70 dark:border-white/10 shadow-2xs">
      <button
        type="button"
        onClick={() => onChange?.('curve')}
        title="Line Chart View"
        className={`flex items-center justify-center rounded-lg px-2.5 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
          value === 'curve'
            ? 'bg-[#FEF08A] text-slate-950 shadow-2xs border border-amber-300/70'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/[0.06]'
        }`}
      >
        <LineChart className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>
      <button
        type="button"
        onClick={() => onChange?.('bars')}
        title="Bar Chart View"
        className={`flex items-center justify-center rounded-lg px-2.5 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
          value === 'bars'
            ? 'bg-[#FEF08A] text-slate-950 shadow-2xs border border-amber-300/70'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/[0.06]'
        }`}
      >
        <BarChart2 className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>
    </div>
  );
}

/**
 * PeriodSelect Component - Allows selecting chart duration (1D, 7D, 1M, 1Y, MAX)
 * Styled with signature OTT dashboard yellow (#FEF08A) active indicator
 */
export function PeriodSelect({
  value,
  options = [],
  onChange,
  className = '',
}) {
  return (
    <div className={`pointer-events-auto inline-flex items-center gap-1 rounded-xl bg-slate-100/90 dark:bg-[#161B16] p-1 border border-slate-200/70 dark:border-white/10 shadow-2xs ${className}`}>
      {options.map((opt) => {
        const isSelected = opt.label === value || opt.value === value;
        const labelText = opt.label || opt.value;

        return (
          <button
            key={labelText}
            type="button"
            onClick={() => onChange?.(opt)}
            className={`rounded-lg px-2.5 py-1 text-xs font-extrabold transition-all cursor-pointer ${
              isSelected
                ? 'bg-[#FEF08A] text-slate-950 shadow-2xs border border-amber-300/70'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/[0.06]'
            }`}
          >
            {labelText}
          </button>
        );
      })}
    </div>
  );
}

export default { ViewToggle, PeriodSelect };
