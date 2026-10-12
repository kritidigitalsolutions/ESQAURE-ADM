import React, { useState, useEffect, useMemo, useRef, useId } from 'react';
import { IndianRupee, ArrowUp, Loader2 } from 'lucide-react';
import AnimatedNumber from './common/AnimatedNumber';
import { subscriptionService } from '../services/subscriptionService';

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
  const [realAnalytics, setRealAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const containerRef = useRef(null);
  const gridId = `income-grid-${useId().replace(/:/g, '')}`;

  useEffect(() => {
    let isMounted = true;
    subscriptionService.getRevenueAnalytics()
      .then((data) => {
        if (!isMounted) return;
        if (data && (data.today || data.monthly || data.yearly)) {
          setRealAnalytics(data);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn('Revenue analytics load fallback:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Period data sets: Today (hourly), Monthly (intervals of month), Yearly (6-month progression)
  const dataMap = useMemo(() => {
    if (realAnalytics) return realAnalytics;

    const now = new Date();
    const monthName = now.toLocaleString('en-US', { month: 'short' });
    return {
      today: {
        label: "TODAY'S REVENUE",
        total: '₹0',
        totalNum: 0,
        trend: '+0.0%',
        subtext: 'vs yesterday (₹0)',
        points: [
          { label: '00:00', value: 0, time: '12:00 AM' },
          { label: '04:00', value: 0, time: '04:00 AM' },
          { label: '08:00', value: 0, time: '08:00 AM' },
          { label: '12:00', value: 0, time: '12:00 PM' },
          { label: '16:00', value: 0, time: '04:00 PM' },
          { label: '20:00', value: 0, time: '08:00 PM' },
          { label: '23:00', value: 0, time: '11:00 PM' },
        ],
      },
      monthly: {
        label: `${monthName.toUpperCase()} ${now.getFullYear()} REVENUE`,
        total: '₹0',
        totalNum: 0,
        trend: '+0.0%',
        subtext: 'vs previous month (₹0)',
        points: [
          { label: `1-5 ${monthName}`, value: 0, time: `1-5 ${monthName}` },
          { label: `6-10 ${monthName}`, value: 0, time: `6-10 ${monthName}` },
          { label: `11-15 ${monthName}`, value: 0, time: `11-15 ${monthName}` },
          { label: `16-20 ${monthName}`, value: 0, time: `16-20 ${monthName}` },
          { label: `21-25 ${monthName}`, value: 0, time: `21-25 ${monthName}` },
          { label: `26-31 ${monthName}`, value: 0, time: `26-31 ${monthName}` },
        ],
      },
      yearly: {
        label: 'PAST 6 MONTHS REVENUE',
        total: '₹0',
        totalNum: 0,
        trend: '+0.0%',
        subtext: 'vs previous 6 mo',
        points: [
          { label: 'May', value: 0, time: 'May' },
          { label: 'Jun', value: 0, time: 'Jun' },
          { label: 'Jul', value: 0, time: 'Jul' },
          { label: 'Aug', value: 0, time: 'Aug' },
          { label: 'Sep', value: 0, time: 'Sep' },
          { label: 'Oct', value: 0, time: 'Oct' },
        ],
      },
    };
  }, [realAnalytics]);

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
      className={`w-full rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#121216] p-4 sm:px-5 sm:py-4 shadow-[0_4px_24px_rgba(0,0,0,0.03)] card-subtle-hover font-sans ${className}`}
    >
      {/* 1. TOP HEADER ROW: Pure clean layout, completely isolated from graph */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/10">
        {/* Left: Title & Subtle Icon */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-xs shadow-2xs shrink-0">
            <IndianRupee className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-950 dark:text-white font-urbanist">
              Platform Income
            </h3>
          </div>
        </div>

        {/* Right: Only the 3 clean period pills requested: Today | Monthly | Yearly */}
        <div className="inline-flex items-center gap-0.5 rounded-lg bg-slate-100/90 dark:bg-[#18181E] p-0.5 border border-slate-200/70 dark:border-white/10 shadow-2xs">
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
                className={`rounded-md px-2.5 py-1 text-[11px] font-extrabold transition-all cursor-pointer ${isActive
                    ? 'bg-[#FEF08A] text-slate-950 shadow-2xs border border-amber-300/70'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/[0.06]'
                  }`}
              >
                {btn.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. BODY ROW: Stat summary on left, Unobstructed wide graph on right */}
      <div className="mt-2.5 flex flex-col md:flex-row items-start justify-between gap-4">
        {/* Left Column: Metric Headline & Subtitle */}
        <div className="w-full md:w-[260px] lg:w-[280px] shrink-0 pt-0.5">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-0.5 font-urbanist transition-all">
            {displaySubtitle}
          </span>
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-2xl sm:text-3xl font-black leading-none tracking-tight text-slate-950 dark:text-white font-urbanist transition-all">
              <AnimatedNumber value={displayAmount} duration={500} />
            </span>

            {/* Yellow Trend Pill Badge */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#FEF08A] text-slate-950 border border-amber-300/80 shadow-2xs shrink-0">
              <ArrowUp className="w-3 h-3 stroke-[2.5]" />
              <AnimatedNumber value={currentData.trend} duration={500} />
            </span>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
            {currentData.subtext}
          </p>
        </div>

        {/* Right Column: Clean, Unobstructed SVG Graph Canvas (NO BUTTONS OVER IT) */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative flex-1 w-full h-[100px] sm:h-[110px] rounded-xl bg-gradient-to-l from-amber-50/25 dark:from-amber-900/10 via-amber-50/10 dark:via-amber-900/5 to-transparent border border-slate-100/90 dark:border-white/10 overflow-hidden cursor-crosshair select-none"
        >
          {/* SVG Spline Curve & Area */}
          <svg
            viewBox={`0 0 ${chartBounds.width} ${chartBounds.height}`}
            preserveAspectRatio="none"
            shapeRendering="geometricPrecision"
            className="w-full h-full overflow-visible"
          >
            <defs>
              <linearGradient id="income-grad-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EAB308" stopOpacity="0.32" />
                <stop offset="65%" stopColor="#EAB308" stopOpacity="0.07" />
                <stop offset="100%" stopColor="#EAB308" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Crisp Horizontal Guidelines */}
            <g className="opacity-30 dark:opacity-15 pointer-events-none">
              {[0.2, 0.55, 0.9].map((ratio, gIdx) => {
                const yPos = chartBounds.padTop + (chartBounds.height - chartBounds.padTop - chartBounds.padBottom) * (1 - ratio);
                return (
                  <line
                    key={`inc-grid-${gIdx}`}
                    x1={0}
                    y1={yPos}
                    x2={chartBounds.width}
                    y2={yPos}
                    stroke="#64748B"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    vectorEffect="non-scaling-stroke"
                    shapeRendering="crispEdges"
                  />
                );
              })}
            </g>

            {/* Filled Area */}
            <path
              d={chartBounds.areaPath}
              fill="url(#income-grad-fill)"
              shapeRendering="geometricPrecision"
              className="transition-all duration-300 ease-out"
            />

            {/* Spline Line (Pin-sharp non-scaling stroke) */}
            <path
              d={chartBounds.splinePath}
              fill="none"
              stroke="#EAB308"
              strokeWidth={2.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              shapeRendering="geometricPrecision"
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
                strokeOpacity={0.8}
                vectorEffect="non-scaling-stroke"
                shapeRendering="crispEdges"
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
              <div className="bg-slate-950/95 dark:bg-[#1E1E26]/95 backdrop-blur-md text-white px-3 py-1 rounded-xl shadow-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 border border-slate-800 dark:border-white/12">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                <span className="font-urbanist font-black text-white">
                  {formatINRFull(activePoint.value)}
                </span>
                <span className="text-slate-400 dark:text-slate-400 font-medium text-[11px] border-l border-slate-800 dark:border-white/10 pl-1.5">
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
