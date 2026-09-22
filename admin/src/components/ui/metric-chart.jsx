import React, { useState, useRef, useMemo, useId, useEffect } from 'react';

export const ACCENTS = {
  amber: {
    stroke: '#EAB308',
    fill: '#FEF08A',
    text: '#854D0E',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badgeBg: '#FEF08A',
    badgeText: '#0F172A',
  },
  emerald: {
    stroke: '#10B981',
    fill: '#D1FAE5',
    text: '#047857',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badgeBg: '#D1FAE5',
    badgeText: '#065F46',
  },
  rose: {
    stroke: '#F43F5E',
    fill: '#FFE4E6',
    text: '#BE123C',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    badgeBg: '#FFE4E6',
    badgeText: '#9F1239',
  },
  blue: {
    stroke: '#3B82F6',
    fill: '#DBEAFE',
    text: '#1D4ED8',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badgeBg: '#DBEAFE',
    badgeText: '#1E40AF',
  },
  neutral: {
    stroke: '#64748B',
    fill: '#F1F5F9',
    text: '#334155',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    badgeBg: '#F1F5F9',
    badgeText: '#1E293B',
  },
};

export const SERIES_COLORS = [
  '#EAB308',
  '#3B82F6',
  '#10B981',
  '#F43F5E',
  '#8B5CF6',
  '#06B6D4',
];

export function formatCompact(value) {
  if (value === null || value === undefined || isNaN(value)) return '0';
  const num = Number(value);
  if (Math.abs(num) >= 1_000_000) {
    return (num / 1_000_000).toFixed(2).replace(/\.00$/, '') + 'M';
  }
  if (Math.abs(num) >= 1_000) {
    return (num / 1_000).toFixed(2).replace(/\.00$/, '') + 'k';
  }
  return num.toLocaleString();
}

/**
 * MetricChart SVG component rendering smooth bezier curve or bar charts.
 * Uses HTML-rendered pinpoint markers to guarantee 100% perfectly round, non-distorted circles.
 */
export function MetricChart({
  series = [],
  view = 'curve',
  defaultIndex,
  hoveredIndex: externalHoveredIdx,
  onHoverIndex,
  valueFormatter = formatCompact,
  dateFormatter = (d) => d,
  className = '',
}) {
  const chartId = useId().replace(/:/g, '');
  const containerRef = useRef(null);
  const rafRef = useRef(null);
  const [internalHoveredIdx, setInternalHoveredIdx] = useState(null);

  const hoveredIdx = externalHoveredIdx !== undefined ? externalHoveredIdx : internalHoveredIdx;
  const isInteracting = hoveredIdx !== null;

  const setHovered = (idx) => {
    setInternalHoveredIdx(idx);
    onHoverIndex?.(idx);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const primarySeries = series[0] || { data: [], color: '#EAB308' };
  const dataPoints = primarySeries.data || [];
  const pointCount = dataPoints.length;

  const activeIndex = isInteracting
    ? hoveredIdx 
    : (defaultIndex !== undefined && defaultIndex >= 0 && defaultIndex < pointCount 
        ? defaultIndex 
        : pointCount - 1);

  // Bounds & Calculations
  const chartCalc = useMemo(() => {
    if (pointCount < 2) return null;

    const allValues = series.flatMap((s) => (s.data || []).map((d) => d.value));
    const maxVal = Math.max(...allValues, 1) * 1.12;
    const minVal = Math.max(0, Math.min(...allValues) * 0.85);
    const valRange = maxVal - minVal || 1;

    const width = 800;
    const height = 260;
    const padTop = 35;
    const padBottom = 25;
    const padLeft = 24;
    const padRight = 24;
    const usableWidth = width - padLeft - padRight;
    const usableHeight = height - padTop - padBottom;

    const mainColor = primarySeries.color || '#EAB308';

    const computedSeries = series.map((s) => {
      const seriesColor = s.color || mainColor;
      const pts = (s.data || []).map((pt, i) => {
        const x = padLeft + (i / Math.max(1, pointCount - 1)) * usableWidth;
        const normY = (pt.value - minVal) / valRange;
        const y = padTop + usableHeight * (1 - normY);
        return { x, y, value: pt.value, date: pt.date, raw: pt };
      });

      // Smooth Bezier Curve Path
      let splinePath = '';
      let areaPath = '';

      if (pts.length > 0) {
        let path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
        for (let i = 0; i < pts.length - 1; i++) {
          const p0 = pts[i === 0 ? 0 : i - 1];
          const p1 = pts[i];
          const p2 = pts[i + 1];
          const p3 = pts[i + 2] || p2;

          const cp1x = p1.x + (p2.x - p0.x) / 5.5;
          const cp1y = p1.y + (p2.y - p0.y) / 5.5;
          const cp2x = p2.x - (p3.x - p1.x) / 5.5;
          const cp2y = p2.y - (p3.y - p1.y) / 5.5;

          path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
        }
        splinePath = path;
        areaPath = `${path} L ${pts[pts.length - 1].x.toFixed(1)} ${height - padBottom} L ${pts[0].x.toFixed(1)} ${height - padBottom} Z`;
      }

      return {
        name: s.name,
        color: seriesColor,
        points: pts,
        splinePath,
        areaPath,
      };
    });

    return {
      width,
      height,
      minVal,
      maxVal,
      usableWidth,
      usableHeight,
      padTop,
      padBottom,
      series: computedSeries,
      mainColor,
    };
  }, [series, pointCount, primarySeries.color]);

  if (!chartCalc || pointCount < 2) {
    return <div className="w-full h-full min-h-[180px] bg-slate-50/50 rounded-xl" />;
  }

  // Smooth RAF-throttled pointer tracking
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const relX = mouseX / rect.width;
    const idx = Math.min(
      pointCount - 1,
      Math.max(0, Math.round(relX * (pointCount - 1)))
    );

    if (idx !== hoveredIdx) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setHovered(idx);
      });
    }
  };

  const handleMouseLeave = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setHovered(null);
  };

  const activePoint = chartCalc.series[0]?.points[activeIndex];
  const themeColor = chartCalc.mainColor;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full h-full select-none cursor-crosshair overflow-visible ${className}`}
    >
      <svg
        viewBox={`0 0 ${chartCalc.width} ${chartCalc.height}`}
        preserveAspectRatio="none"
        className="w-full h-full overflow-visible"
      >
        <defs>
          <linearGradient id={`grad-unified-${chartId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={themeColor} stopOpacity="0.22" />
            <stop offset="65%" stopColor={themeColor} stopOpacity="0.05" />
            <stop offset="100%" stopColor={themeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* View mode: Curve */}
        {view === 'curve' && (
          <>
            {/* Area Fill */}
            {chartCalc.series.map((s, idx) => (
              <path
                key={`area-${idx}`}
                d={s.areaPath}
                fill={`url(#grad-unified-${chartId})`}
                className="transition-all duration-300 ease-out"
              />
            ))}

            {/* Smooth Spline Vector Curve (Ultra-clean, zero distortion) */}
            {chartCalc.series.map((s, idx) => (
              <path
                key={`line-${idx}`}
                d={s.splinePath}
                fill="none"
                stroke={s.color}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-300 ease-out"
              />
            ))}
          </>
        )}

        {/* View mode: Bars */}
        {view === 'bars' && (
          <g>
            {chartCalc.series[0].points.map((pt, pIdx) => {
              const stepW = chartCalc.usableWidth / Math.max(1, pointCount - 1);
              const barW = Math.max(16, Math.min(stepW * 0.88, 52));
              const groundY = chartCalc.height - chartCalc.padBottom;
              const barH = Math.max(6, groundY - pt.y);
              const isActive = isInteracting && pIdx === activeIndex;

              return (
                <g
                  key={`bar-group-${pIdx}`}
                  onClick={() => setHovered(pIdx)}
                  onMouseEnter={() => setHovered(pIdx)}
                  className="cursor-pointer group/bar"
                >
                  {/* Invisible Hitbox Column */}
                  <rect
                    x={pt.x - stepW / 2}
                    y={0}
                    width={stepW}
                    height={chartCalc.height}
                    fill="transparent"
                  />

                  {/* Active Bar Highlight Backdrop Ring when interacting */}
                  {isActive && (
                    <rect
                      x={pt.x - barW / 2 - 2}
                      y={pt.y - 2}
                      width={barW + 4}
                      height={barH + 4}
                      rx={8}
                      fill={themeColor}
                      fillOpacity={0.2}
                      className="transition-all duration-200 ease-out"
                    />
                  )}

                  {/* Main Rounded Bar */}
                  <rect
                    x={pt.x - barW / 2}
                    y={pt.y}
                    width={barW}
                    height={barH}
                    rx={6}
                    fill={themeColor}
                    fillOpacity={isInteracting ? (isActive ? 1.0 : 0.45) : 0.85}
                    className="transition-all duration-200 ease-out"
                  />
                </g>
              );
            })}
          </g>
        )}

        {/* Hover Crosshair Vertical Guide Line */}
        {isInteracting && activePoint && (
          <line
            x1={activePoint.x}
            y1={15}
            x2={activePoint.x}
            y2={chartCalc.height - chartCalc.padBottom}
            stroke="#EAB308"
            strokeWidth={1.5}
            strokeDasharray="3 3"
            strokeOpacity={0.6}
            className="transition-all duration-150 ease-out pointer-events-none"
          />
        )}
      </svg>

      {/* 100% Perfectly Round HTML Active Point Pinpoint Marker (Zero SVG distortion!) */}
      {isInteracting && activePoint && view === 'curve' && (
        <div
          className="pointer-events-none absolute z-20 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-150 ease-out"
          style={{
            left: `${(activePoint.x / chartCalc.width) * 100}%`,
            top: `${(activePoint.y / chartCalc.height) * 100}%`,
          }}
        >
          <div className="relative flex items-center justify-center">
            <span className="absolute w-6 h-6 rounded-full bg-amber-400/30 border border-amber-300/50" />
            <span className="relative w-3.5 h-3.5 rounded-full bg-white border-[2.5px] border-amber-500 shadow-md" />
          </div>
        </div>
      )}

      {/* Floating Tooltip Indicator */}
      {isInteracting && activePoint && (
        <div
          className="pointer-events-none absolute z-30 flex flex-col items-center transform -translate-x-1/2 transition-all duration-150 ease-out"
          style={{
            left: `${(activePoint.x / chartCalc.width) * 100}%`,
            top: `${Math.max(5, (activePoint.y / chartCalc.height) * 100 - 16)}%`,
          }}
        >
          <div className="bg-slate-950/95 backdrop-blur-md text-white px-3.5 py-1.5 rounded-xl shadow-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 border border-slate-800">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block border border-white/20"
              style={{ backgroundColor: themeColor }}
            />
            <span className="font-urbanist font-black text-white">{valueFormatter(activePoint.value)}</span>
            {activePoint.date && (
              <span className="text-slate-400 font-medium text-[11px] border-l border-slate-800 pl-1.5">
                {dateFormatter(activePoint.date)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MetricChart;
