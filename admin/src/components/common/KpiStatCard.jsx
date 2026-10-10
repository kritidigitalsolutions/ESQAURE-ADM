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
      className={`relative overflow-hidden rounded-2xl p-3.5 sm:p-4 transition-all duration-300 flex flex-col justify-between group select-none
        bg-white dark:bg-[#121216] 
        border border-slate-200/90 dark:border-white/10 
        shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)] dark:shadow-none 
        hover:shadow-xl dark:hover:border-amber-400/40 
        hover:-translate-y-0.5 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div>
        {/* Card Header Row */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center space-x-2.5 min-w-0">
            {/* Standard KPI Metric Icon Badge */}
            {Icon && (
              <div className="w-8.5 h-8.5 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 group-hover:scale-105 transition-all duration-300 shadow-xs shrink-0">
                <Icon className="w-4 h-4 stroke-[2.2]" />
              </div>
            )}
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-slate-950 dark:text-white uppercase tracking-wider block font-urbanist truncate">
                {title}
              </span>
              {subtitle && (
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block truncate mt-0.5">
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
        <div className="mt-3 flex items-baseline justify-between gap-2">
          <div className="text-2xl sm:text-[28px] font-black font-urbanist text-slate-950 dark:text-white tracking-tight leading-none group-hover:text-amber-950 dark:group-hover:text-amber-200 transition-colors">
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
        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[10.5px] font-medium leading-normal gap-2">
          {footerLeft && <span className={`truncate ${footerLeftColor}`}>{footerLeft}</span>}
          {footerRight && (
            <span className={`shrink-0 px-1.5 py-0.5 rounded-md bg-amber-100/60 dark:bg-amber-400/10 border border-amber-300/40 dark:border-amber-400/30 ${footerRightColor}`}>
              {footerRight}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
