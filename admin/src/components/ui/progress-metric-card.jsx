import React, { useId, useMemo, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react';
import AnimatedNumber from '../common/AnimatedNumber';
import {
  ACCENTS,
  formatCompact,
  MetricChart,
  SERIES_COLORS,
} from './metric-chart';
import { PeriodSelect, ViewToggle } from './metric-controls';

const DEFAULT_PERIODS = [
  { label: '1D', points: 7 },
  { label: '7D', points: 7 },
  { label: '1M', points: 7 },
  { label: '1Y', points: 7 },
  { label: 'MAX', points: 6 },
];

const sliceWindow = (points, n) =>
  n && n < points.length ? points.slice(-n) : points;

export default function ProgressMetricCard({
  title,
  subtitle,
  total,
  delta,
  deltaLabel = 'today',
  percent,
  trend,
  unit,
  period = '7D',
  periodOptions,
  onPeriodChange,
  defaultView = 'bars',
  accent = 'amber',
  data,
  series,
  defaultIndex,
  showStats = true,
  valueFormatter,
  dateFormatter,
  loading = false,
  className = '',
  size = 'md',
  // Header Tabs (e.g. Users vs Subscribers)
  activeTab,
  onTabChange,
  tabs = [],
}) {
  const isCompact = size === 'sm';
  const gridId = `grid-${useId().replace(/:/g, '')}`;
  const minHeightClass = isCompact ? 'min-h-[190px] sm:min-h-[210px]' : 'min-h-[290px] sm:min-h-[310px]';
  const shell = `relative flex ${minHeightClass} w-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#121216] shadow-[0_4px_24px_rgba(0,0,0,0.03)] card-subtle-hover ${className}`;

  const periods = periodOptions ?? DEFAULT_PERIODS;
  const [selectedLabel, setSelectedLabel] = useState(period);
  const [view, setView] = useState(defaultView);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Normalize input into series list
  const baseSeries = useMemo(
    () => (series?.length ? series : [{ name: title, data: data ?? [], accent }]),
    [series, data, title, accent]
  );

  const selectedOption =
    periods.find((p) => p.label === selectedLabel || p.value === selectedLabel) ?? periods[periods.length - 1];

  // Slice each series according to period
  const visibleSeries = useMemo(
    () => baseSeries.map((s) => ({ ...s, data: sliceWindow(s.data, selectedOption?.points) })),
    [baseSeries, selectedOption]
  );

  const primary = visibleSeries[0];
  const isMulti = visibleSeries.length > 1;
  const hasData = (primary?.data.length ?? 0) >= 2;

  // Deriving statistics from primary series
  const stats = useMemo(() => {
    const vals = primary?.data.map((d) => d.value) ?? [];
    const sum = vals.reduce((a, b) => a + b, 0);
    const first = vals[0] ?? 0;
    const last = vals[vals.length - 1] ?? 0;
    const prev = vals[vals.length - 2] ?? first;
    const net = last - first;
    return {
      sum,
      net,
      pct: first ? (net / first) * 100 : 0,
      step: last - prev,
      peak: vals.length ? Math.max(...vals) : 0,
      low: vals.length ? Math.min(...vals) : 0,
      avg: vals.length ? sum / vals.length : 0,
    };
  }, [primary]);

  // Unified color theme accent
  const resolvedAccent = accent ?? 'amber';
  const color = ACCENTS[resolvedAccent] || ACCENTS.amber;

  const fmtCompact = valueFormatter ?? formatCompact;
  const fmtFull = valueFormatter ?? ((n) => n.toLocaleString() + (unit ? ` ${unit}` : ''));
  const fmtDate = dateFormatter ?? ((d) => d);
  const sign = (n) => (n >= 0 ? '+' : '−') + fmtCompact(Math.abs(n));

  const displayTotal = total ?? fmtCompact(stats.peak || stats.sum);
  const displayDelta = delta ?? sign(stats.step);
  const displayPercent = percent ?? `${stats.pct >= 0 ? '+' : ''}${stats.pct.toFixed(0)}%`;

  // Dynamic focused point calculations on hover/click
  const focusedPt = hoveredIdx !== null ? primary?.data[hoveredIdx] : null;
  const activeTotalDisplay = focusedPt ? fmtCompact(focusedPt.value) : displayTotal;
  const activeSublabel = focusedPt ? (focusedPt.date ? `FOCUSED TIME POINT (${focusedPt.date})` : 'FOCUSED TIME POINT') : 'PEAK PERIOD POINT';

  // Format Chart series
  const chartSeries = visibleSeries.map((s, i) => ({
    name: s.name,
    data: s.data,
    color: '#EAB308',
  }));

  const lastIndex = (primary?.data.length ?? 1) - 1;
  const fallback = Math.min(defaultIndex ?? lastIndex, lastIndex);

  const handlePeriodChange = (option) => {
    setSelectedLabel(option.label || option.value);
    setHoveredIdx(null);
    onPeriodChange?.(option);
  };

  if (loading) {
    return (
      <div className={shell} aria-busy="true">
        <div className="flex flex-1 flex-col p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div className="h-6 w-40 animate-pulse rounded-md bg-slate-200" />
            <div className="h-8 w-28 animate-pulse rounded-xl bg-slate-200" />
          </div>
          <div className="mt-8 h-12 w-48 animate-pulse rounded-xl bg-slate-200" />
          <div className="mt-auto h-32 w-full animate-pulse rounded-2xl bg-slate-100" />
        </div>
        <div className="border-t border-slate-100 px-6 py-4">
          <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className={shell}>
        <div className="flex flex-1 flex-col p-6 sm:p-8">
          <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-950 font-urbanist">{title}</h3>
          <div className="flex flex-1 flex-col items-center justify-center gap-1 py-12 text-center">
            <p className="text-sm font-semibold text-slate-700">No metrics available</p>
            <p className="text-xs text-slate-400">
              Data will appear once user traffic is recorded.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={shell}>
      {/* Background Graphic SVG Canvas Area */}
      <div className="absolute inset-y-0 right-0 z-0 pointer-events-none w-[60%] sm:w-[55%]">
        {/* Soft gradient wash */}
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to left, ${color.stroke}18, transparent 85%)` }}
        />
        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 text-slate-300/40"
          style={{
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 40%)',
            maskImage: 'linear-gradient(to right, transparent, black 40%)',
          }}
        >
          <svg className="h-full w-full" aria-hidden="true">
            <defs>
              <pattern id={gridId} width="16" height="16" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="1" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${gridId})`} />
          </svg>
        </div>

        {/* Embedded Interactive MetricChart SVG */}
        <div className={`absolute inset-0 ${isCompact ? 'pt-8 pb-4 pr-3' : 'pt-14 pb-8 pr-3'} pointer-events-auto`}>
          <MetricChart
            series={chartSeries}
            view={view}
            defaultIndex={fallback}
            hoveredIndex={hoveredIdx}
            onHoverIndex={setHoveredIdx}
            valueFormatter={fmtFull}
            dateFormatter={fmtDate}
          />
        </div>
      </div>

      {/* Main Card Content Layout */}
      <div className={`relative z-10 flex flex-1 flex-col ${isCompact ? 'p-3.5 sm:p-4' : 'p-4 sm:p-5'} pointer-events-none`}>
        {/* Top Header Row: Title + Toggle Switchers */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pointer-events-none">
          <div className="pointer-events-auto w-fit">
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-950 dark:text-white font-urbanist">{title}</h3>
              <ViewToggle value={view} onChange={setView} />
            </div>
            {subtitle && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">{subtitle}</p>
            )}
          </div>

          {/* Unified Signature Dashboard Pill Tabs (Users vs Subscribers) */}
          {tabs.length > 0 && (
            <div className="pointer-events-auto inline-flex items-center gap-0.5 rounded-lg bg-slate-100/90 dark:bg-[#18181E] p-0.5 border border-slate-200/70 dark:border-white/10 shadow-2xs self-start sm:self-auto">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setHoveredIdx(null);
                      onTabChange?.(tab.id);
                    }}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-extrabold transition-all cursor-pointer ${isActive
                        ? 'bg-[#FEF08A] text-slate-950 shadow-2xs border border-amber-300/70'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800'
                      }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Multi-series legend */}
        {isMulti && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 w-fit pointer-events-auto">
            {chartSeries.map((s) => (
              <span
                key={s.name}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500"
              >
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                {s.name}
              </span>
            ))}
          </div>
        )}

        {/* Polished Metric Headline & Peak/Focused Badge */}
        <div className={`${isCompact ? 'mt-2' : 'mt-2.5 sm:mt-3'} w-fit pointer-events-none`}>
          <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-0.5 font-urbanist transition-all">
            {activeSublabel}
          </span>
          <div className="flex items-baseline flex-wrap gap-2">
            <span className={`${isCompact ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'} font-black leading-none tracking-tight text-slate-950 dark:text-white font-urbanist transition-all select-text pointer-events-auto`}>
              <AnimatedNumber value={activeTotalDisplay} duration={500} /> {unit && !activeTotalDisplay.includes(unit) ? <span className="text-lg sm:text-xl font-bold text-slate-600 dark:text-slate-400">{unit}</span> : ''}
            </span>

            {/* Signature OTT Dashboard Yellow / Emerald Trend Badge */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#FEF08A] text-slate-950 border border-amber-300/80 shadow-2xs pointer-events-auto">
              <ArrowUp className="w-3 h-3 stroke-[2.5]" />
              <AnimatedNumber value={displayPercent} duration={500} />
            </span>
          </div>
        </div>

        {/* Period Selector: Shifted to Left Bottom Above Dates */}
        <div className={`${isCompact ? 'mt-2 pt-0.5' : 'mt-auto pt-2.5 sm:pt-3'} w-fit pointer-events-none`}>
          <PeriodSelect
            value={selectedLabel}
            options={periods}
            onChange={handlePeriodChange}
          />
        </div>
      </div>

      {/* Footer Area: Timeline Date Labels */}
      <div
        className={`relative z-10 flex items-center justify-between border-t border-slate-100 dark:border-white/10 bg-white/95 dark:bg-[#141419]/95 backdrop-blur-xs ${isCompact ? 'px-2 sm:px-3 py-1' : 'px-2.5 sm:px-3.5 py-1.5'}`}
      >
        {/* Dynamic Compact Auto-Fitting Date Labels Under Graph */}
        <div className="flex items-center justify-between w-full gap-0.5 sm:gap-1 overflow-x-auto sm:overflow-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {primary?.data?.map((pt, idx) => {
            const isSelected = hoveredIdx === idx;
            return (
              <button
                key={idx}
                type="button"
                title={pt.date}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => setHoveredIdx(idx)}
                className={`flex-1 min-w-0 py-1 px-0.5 sm:px-1 rounded-md transition-all text-center cursor-pointer ${isSelected
                    ? 'bg-[#FEF08A] text-slate-950 font-extrabold shadow-2xs ring-1 ring-amber-400/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                  }`}
              >
                <span className="block truncate text-[9.5px] sm:text-[10px] md:text-[11px] font-semibold leading-tight tracking-tight">
                  {pt.date}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
