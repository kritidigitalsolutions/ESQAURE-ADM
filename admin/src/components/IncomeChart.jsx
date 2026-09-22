import React, { useState, useMemo, useRef, useId } from 'react';
import { IndianRupee, ArrowUp } from 'lucide-react';
import AnimatedNumber from './common/AnimatedNumber';

// Format currency in Indian Rupee (₹)
export function formatINR(val) {
  if (val === null || val === undefined || isNaN(val)) return '₹0';
  const num = Number(val);
  if (Math.abs(num) >= 10000000) {
    return '₹' + (num / 10000000).toFixed(2).replace(/\.00$/, '') + ' Cr';
  }
  if (Math.abs(num) >= 100000) {
    return '₹' + (num / 100000).toFixed(2).replace(/\.00$/, '') + ' Lakh';
  }
  if (Math.abs(num) >= 1000) {
    return '₹' + (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return '₹' + num.toLocaleString('en-IN');
}

export function formatINRFull(val) {
  if (val === null || val === undefined || isNaN(val)) return '₹0';
  return '₹' + Number(val).toLocaleString('en-IN');
}

export default function IncomeChart({ className = '' }) {
  // Only 3 clean periods requested by user: 'today', 'monthly', 'yearly'
  const [period, setPeriod] = useState('monthly');
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const containerRef = useRef(null);
  const gridId = `income-grid-${useId().replace(/:/g, '')}`;

  // Period data sets: Today (hourly), Monthly (weeks of current month), Yearly (6-month progression)
  const dataMap = useMemo(() => {
    return {
      today: {
        label: "TODAY'S REVENUE",
        total: '₹18,450',
        totalNum: 18450,
        trend: '+18.4%',
        subtext: 'vs yesterday (₹15,580)',
        points: [
          { label: '00:00', value: 1450, time: '12:00 AM' },
          { label: '04:00', value: 920, time: '04:00 AM' },
          { label: '08:00', value: 3850, time: '08:00 AM' },
          { label: '12:00', value: 7920, time: '12:00 PM' },
          { label: '16:00', value: 6400, time: '04:00 PM' },
          { label: '20:00', value: 11800, time: '08:00 PM' },
          { label: '23:00', value: 14650, time: '11:00 PM' },
        ],
      },
      monthly: {
        label: 'MARCH 2026 REVENUE',
        total: '₹4,85,200',
        totalNum: 485200,
        trend: '+24.8%',
        subtext: 'vs Feb 2026 (₹4,20,000)',
        points: [
          { label: '1-5 Mar', value: 68000, time: '1-5 Mar' },
          { label: '6-10 Mar', value: 145000, time: '6-10 Mar' },
          { label: '11-15 Mar', value: 235000, time: '11-15 Mar' },
          { label: '16-20 Mar', value: 342000, time: '16-20 Mar' },
          { label: '21-25 Mar', value: 418000, time: '21-25 Mar' },
          { label: '26-31 Mar', value: 485200, time: '26-31 Mar' },
        ],
      },
      yearly: {
        label: 'PAST 6 MONTHS REVENUE',
        total: '₹21.25 Lakh',
        totalNum: 2125200,
        trend: '+38.2%',
        subtext: 'vs previous 6 mo',
        points: [
          { label: 'Oct 25', value: 210000, time: 'Oct 2025' },
          { label: 'Nov 25', value: 275000, time: 'Nov 2025' },
          { label: 'Dec 25', value: 340000, time: 'Dec 2025' },
          { label: 'Jan 26', value: 395000, time: 'Jan 2026' },
          { label: 'Feb 26', value: 420000, time: 'Feb 2026' },
          { label: 'Mar 26', value: 485200, time: 'Mar 2026' },
        ],
      },
    };
  }, []);

  const currentData = dataMap[period];
  const points = currentData.points;
  const pointCount = points.length;

  // Chart coordinate calculations
  const chartBounds = useMemo(() => {
    const width = 800;
    const height = 180;
    const padTop = 22;
    const padBottom = 20;
    const padLeft = 20;
    const padRight = 20;
    const usableW = width - padLeft - padRight;
    const usableH = height - padTop - padBottom;

    const values = points.map((p) => p.value);
    const maxVal = Math.max(...values) * 1.08;
    const minVal = Math.max(0, Math.min(...values) * 0.88);
    const valRange = maxVal - minVal || 1;

    const coords = points.map((pt, i) => {
      const x = padLeft + (i / Math.max(1, pointCount - 1)) * usableW;
      const normY = (pt.value - minVal) / valRange;
      const y = padTop + usableH * (1 - normY);
      return { x, y, value: pt.value, label: pt.label, time: pt.time };
    });

    // Spline curve construction
    let splinePath = '';
    let areaPath = '';
    if (coords.length > 0) {
      let path = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
      for (let i = 0; i < coords.length - 1; i++) {
        const p0 = coords[i === 0 ? 0 : i - 1];
        const p1 = coords[i];
        const p2 = coords[i + 1];
        const p3 = coords[i + 2] || p2;

        const cp1x = p1.x + (p2.x - p0.x) / 5.5;
        const cp1y = p1.y + (p2.y - p0.y) / 5.5;
        const cp2x = p2.x - (p3.x - p1.x) / 5.5;
        const cp2y = p2.y - (p3.y - p1.y) / 5.5;

        path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
      }
      splinePath = path;
      areaPath = `${path} L ${coords[coords.length - 1].x.toFixed(1)} ${height} L ${coords[0].x.toFixed(1)} ${height} Z`;
    }

    return {
      width,
      height,
      padTop,
      padBottom,
      coords,
      splinePath,
      areaPath,
    };
  }, [points, pointCount]);

  // Handle pointer tracking smoothly within the chart canvas only
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, mouseX / rect.width));
    const idx = Math.round(ratio * (pointCount - 1));
    if (idx !== hoveredIdx) {
      setHoveredIdx(idx);
    }
  };

  const handleMouseLeave = () => {
    setHoveredIdx(null);
  };

  const isHovering = hoveredIdx !== null && hoveredIdx >= 0 && hoveredIdx < pointCount;
  const activePoint = isHovering ? chartBounds.coords[hoveredIdx] : null;

  // Active value sync for the stat block
  const displayAmount = isHovering
    ? formatINRFull(activePoint.value)
    : currentData.total;

  const displaySubtitle = isHovering
    ? `FOCUSED TIME • ${activePoint.time}`
    : currentData.label;

  return (
    <div
      className={`w-full rounded-[28px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111111] p-5 sm:px-7 sm:py-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] card-subtle-hover font-sans ${className}`}
    >
      {/* 1. TOP HEADER ROW: Pure clean layout, completely isolated from graph */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
        {/* Left: Title & Subtle Icon */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100/90 dark:bg-amber-900/30 border border-amber-300/70 dark:border-amber-700/40 flex items-center justify-center text-slate-950 shadow-2xs shrink-0">
            <IndianRupee className="w-4 h-4 stroke-[2.5] dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-extrabold tracking-tight text-slate-950 dark:text-white font-urbanist">
              Platform Income
            </h3>
          </div>
        </div>

        {/* Right: Only the 3 clean period pills requested: Today | Monthly | Yearly */}
        <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100/90 dark:bg-slate-900 p-1 border border-slate-200/70 dark:border-slate-700 shadow-2xs">
          {[
            { id: 'today', label: 'Today' },
            { id: 'monthly', label: 'Monthly' },
            { id: 'yearly', label: 'Yearly' },
          ].map((btn) => {
            const isActive = period === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => {
                  setHoveredIdx(null);
                  setPeriod(btn.id);
                }}
                className={`rounded-lg px-3.5 py-1 text-xs font-extrabold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#FEF08A] text-slate-950 shadow-2xs border border-amber-300/70'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800'
                }`}
              >
                {btn.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. BODY ROW: Stat summary on left, Unobstructed wide graph on right */}
      <div className="mt-3 flex flex-col md:flex-row items-start justify-between gap-6">
        {/* Left Column: Metric Headline & Subtitle */}
        <div className="w-full md:w-[280px] lg:w-[320px] shrink-0 pt-0.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1 font-urbanist transition-all">
            {displaySubtitle}
          </span>
          <div className="flex items-center flex-wrap gap-2.5">
            <span className="text-4xl sm:text-[42px] lg:text-[46px] font-black leading-none tracking-tight text-slate-950 dark:text-white font-urbanist transition-all">
              <AnimatedNumber value={displayAmount} duration={500} />
            </span>

            {/* Yellow Trend Pill Badge */}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#FEF08A] text-slate-950 border border-amber-300/80 shadow-2xs shrink-0">
              <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
              <AnimatedNumber value={currentData.trend} duration={500} />
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-500 font-medium mt-1.5">
            {currentData.subtext}
          </p>
        </div>

        {/* Right Column: Clean, Unobstructed SVG Graph Canvas (NO BUTTONS OVER IT) */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative flex-1 w-full h-[120px] sm:h-[130px] rounded-2xl bg-gradient-to-l from-amber-50/40 dark:from-amber-900/10 via-amber-50/15 dark:via-amber-900/5 to-transparent border border-slate-100/90 dark:border-slate-800 overflow-hidden cursor-crosshair select-none"
        >
          {/* Subtle Dotted Pattern Overlay */}
          <div
            className="absolute inset-0 text-slate-300/35 pointer-events-none"
            style={{
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 20%)',
              maskImage: 'linear-gradient(to right, transparent, black 20%)',
            }}
          >
            <svg className="h-full w-full" aria-hidden="true">
              <defs>
                <pattern id={gridId} width="16" height="16" patternUnits="userSpaceOnUse">
                  <circle cx="1.5" cy="1.5" r="1.2" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#${gridId})`} />
            </svg>
          </div>

          {/* SVG Spline Curve & Area */}
          <svg
            viewBox={`0 0 ${chartBounds.width} ${chartBounds.height}`}
            preserveAspectRatio="none"
            className="w-full h-full overflow-visible"
          >
            <defs>
              <linearGradient id="income-grad-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EAB308" stopOpacity="0.25" />
                <stop offset="60%" stopColor="#EAB308" stopOpacity="0.06" />
                <stop offset="100%" stopColor="#EAB308" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Filled Area */}
            <path
              d={chartBounds.areaPath}
              fill="url(#income-grad-fill)"
              className="transition-all duration-300 ease-out"
            />

            {/* Spline Line */}
            <path
              d={chartBounds.splinePath}
              fill="none"
              stroke="#EAB308"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300 ease-out"
            />

            {/* Hover Vertical Guide Line (Stays strictly inside chart area) */}
            {isHovering && activePoint && (
              <line
                x1={activePoint.x}
                y1={chartBounds.padTop - 8}
                x2={activePoint.x}
                y2={chartBounds.height}
                stroke="#EAB308"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                strokeOpacity={0.7}
                className="pointer-events-none transition-all duration-100"
              />
            )}

            {/* Hover Active Point Indicator */}
            {isHovering && activePoint && (
              <g className="transition-all duration-100">
                <circle
                  cx={activePoint.x}
                  cy={activePoint.y}
                  r={8}
                  fill="#EAB308"
                  fillOpacity={0.25}
                />
                <circle
                  cx={activePoint.x}
                  cy={activePoint.y}
                  r={4.5}
                  fill="#FFFFFF"
                  stroke="#EAB308"
                  strokeWidth={2.5}
                />
              </g>
            )}
          </svg>

          {/* Floating Tooltip Pill (Clamped cleanly so it never clips) */}
          {isHovering && activePoint && (
            <div
              className="pointer-events-none absolute z-30 flex flex-col items-center transform -translate-x-1/2 transition-all duration-75 ease-out"
              style={{
                left: `${Math.max(8, Math.min(92, (activePoint.x / chartBounds.width) * 100))}%`,
                top: activePoint.y < 45 ? '48%' : `${Math.max(6, (activePoint.y / chartBounds.height) * 100 - 28)}%`,
              }}
            >
              <div className="bg-slate-950/95 backdrop-blur-md text-white px-3 py-1 rounded-xl shadow-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 border border-slate-800">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                <span className="font-urbanist font-black text-white">
                  {formatINRFull(activePoint.value)}
                </span>
                <span className="text-slate-400 font-medium text-[11px] border-l border-slate-800 pl-1.5">
                  {activePoint.time}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
