import React from 'react';
import Badge from './Badge';
import AnimatedNumber from './AnimatedNumber';

/**
 * Ultra-Premium KPI Stat Card Component for ESQUARE Admin.
 * Complies 100% with Material Design guidelines & brand visual identity (#FEF08A).
 */
export default function KpiStatCard({
  icon: Icon,
  title,
  subtitle,
  value,
  animateNumber = false,
  badgeVariant,
  badgeLabel,
  hideBadgeIcon = false,
  footerLeft,
  footerRight,
  footerLeftColor = 'text-slate-500 dark:text-slate-400 font-medium',
  footerRightColor = 'text-emerald-600 dark:text-emerald-400 font-bold',
  onClick,
  className = '',
}) {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between group select-none
        bg-white dark:bg-[#121612] 
        border border-slate-200/90 dark:border-white/10 
        shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] dark:shadow-none 
        hover:shadow-xl dark:hover:border-amber-400/40 
        hover:-translate-y-1 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div>
        {/* Card Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            {/* Standard KPI Metric Icon Badge */}
            {Icon && (
              <div className="w-10 h-10 rounded-xl bg-[#FEF08A] dark:bg-[#FEF08A]/20 border border-amber-300/80 dark:border-amber-500/40 flex items-center justify-center text-slate-950 dark:text-amber-300 group-hover:scale-110 transition-all duration-300 shadow-xs shrink-0">
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </div>
            )}
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-950 dark:text-white uppercase tracking-wider block font-urbanist truncate">
                {title}
              </span>
              {subtitle && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block truncate mt-0.5">
                  {subtitle}
                </span>
              )}
            </div>
          </div>

          {/* Badge Pill */}
          {badgeVariant && (
            <div className="shrink-0 pt-0.5">
              <Badge variant={badgeVariant} label={badgeLabel} hideIcon={hideBadgeIcon} />
            </div>
          )}
        </div>

        {/* Center Main Value Row */}
        <div className="mt-4 flex items-baseline justify-between gap-2">
          <div className="text-3xl sm:text-4xl font-black font-urbanist text-slate-950 dark:text-white tracking-tight leading-none group-hover:text-amber-950 dark:group-hover:text-amber-200 transition-colors">
            {animateNumber && typeof value === 'number' ? (
              <AnimatedNumber value={value} />
            ) : (
              value
            )}
          </div>
        </div>
      </div>

      {/* Footer Meta Row */}
      {(footerLeft || footerRight) && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px] font-medium leading-normal gap-2">
          {footerLeft && <span className={`truncate ${footerLeftColor}`}>{footerLeft}</span>}
          {footerRight && (
            <span className={`shrink-0 px-2 py-0.5 rounded-md bg-amber-100/60 dark:bg-amber-900/30 border border-amber-300/40 dark:border-amber-700/40 ${footerRightColor}`}>
              {footerRight}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
