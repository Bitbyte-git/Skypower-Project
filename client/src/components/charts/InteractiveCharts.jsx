import React, { useState } from 'react';
import {
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  Zap,
  Activity,
  Calendar,
  Layers,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

// ============================================================================
// 1. EXTRAORDINARY INTERACTIVE DONUT / PIE CHART COMPONENT
// ============================================================================
export const PieChartCard = ({
  title,
  subtitle,
  data = [],
  totalLabel = 'Total Portfolio',
  unit = 'Enquiries'
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Filter out any invalid / undefined data entries
  const validData = (data || []).filter(
    (d) => d && d.label !== 'undefined' && d._id !== 'undefined' && d.status !== 'undefined'
  );

  const total = validData.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  const size = 180;
  const center = size / 2;
  const radius = 70;
  const innerRadius = 46;
  const gapAngle = validData.length > 1 ? 0.045 : 0;

  let cumulativeAngle = -Math.PI / 2;

  const slices = validData.map((item, idx) => {
    const val = Number(item.value) || 0;
    const fraction = total > 0 ? val / total : 0;
    const rawAngle = fraction * 2 * Math.PI;
    const effectiveAngle = Math.max(0, rawAngle - gapAngle);

    const startAngle = cumulativeAngle + gapAngle / 2;
    const endAngle = startAngle + effectiveAngle;
    cumulativeAngle += rawAngle;

    const isHovered = hoveredIndex === idx;
    const r = isHovered ? radius + 4 : radius;
    const ir = isHovered ? innerRadius - 1 : innerRadius;

    // Outer arc points
    const x1 = center + r * Math.cos(startAngle);
    const y1 = center + r * Math.sin(startAngle);
    const x2 = center + r * Math.cos(endAngle);
    const y2 = center + r * Math.sin(endAngle);

    // Inner arc points
    const ix1 = center + ir * Math.cos(endAngle);
    const iy1 = center + ir * Math.sin(endAngle);
    const ix2 = center + ir * Math.cos(startAngle);
    const iy2 = center + ir * Math.sin(startAngle);

    const largeArcFlag = effectiveAngle > Math.PI ? 1 : 0;

    const pathData =
      total > 0 && fraction < 1
        ? `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${ir} ${ir} 0 ${largeArcFlag} 0 ${ix2} ${iy2} Z`
        : total > 0 && fraction === 1
        ? `M ${center - r} ${center} A ${r} ${r} 0 1 0 ${center + r} ${center} A ${r} ${r} 0 1 0 ${center - r} ${center} M ${center - ir} ${center} A ${ir} ${ir} 0 1 1 ${center + ir} ${center} A ${ir} ${ir} 0 1 1 ${center - ir} ${center} Z`
        : '';

    const cleanLabel =
      item.label && item.label !== 'undefined'
        ? item.label
        : item._id && item._id !== 'undefined'
        ? item._id
        : item.status && item.status !== 'undefined'
        ? item.status
        : 'Other';

    return {
      ...item,
      label: cleanLabel,
      pathData,
      fraction,
      percent: Math.round(fraction * 100),
      isHovered
    };
  });

  const activeItem = hoveredIndex !== null ? slices[hoveredIndex] : null;

  return (
    <div
      className="bg-white p-5 rounded-2xl border transition-all overflow-hidden"
      style={{
        borderColor: '#DFEAF6',
        boxShadow: '0 3px 8px rgba(15, 55, 100, 0.05), 0 10px 24px rgba(15, 55, 100, 0.07)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: '#EAF0F7' }}>
        <div className="min-w-0 pr-2">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: '#0878C9' }} />
            <h3 className="text-sm font-bold truncate" style={{ color: '#102B50' }}>{title}</h3>
          </div>
          {subtitle && <p className="text-[11px] font-medium mt-0.5 truncate text-slate-500">{subtitle}</p>}
        </div>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0"
          style={{ background: '#EAF5FF', color: '#0878C9', borderColor: '#C5DFF5' }}
        >
          Segment Share
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-5 w-full min-w-0">
        {/* SVG Donut Graphic */}
        <div className="relative flex items-center justify-center shrink-0 w-[180px] h-[180px]">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="overflow-hidden select-none"
          >
            {slices.map((slice, idx) => (
              <path
                key={idx}
                d={slice.pathData}
                fill={slice.color}
                className="transition-all duration-300 cursor-pointer"
                style={{
                  opacity: hoveredIndex === null || hoveredIndex === idx ? 1 : 0.45,
                  filter:
                    hoveredIndex === idx
                      ? `drop-shadow(0 3px 8px ${slice.color}80)`
                      : 'none'
                }}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <title>{`${slice.label}: ${slice.value} ${unit} (${slice.percent}%)`}</title>
              </path>
            ))}
          </svg>

          {/* Center Telemetry Hole */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-1">
            {activeItem ? (
              <div className="animate-in fade-in zoom-in-95 duration-150 flex flex-col items-center justify-center">
                <span className="text-2xl font-black font-mono tracking-tight text-[#FF7A18]">
                  {activeItem.percent}%
                </span>
                <span className="text-xs font-bold font-mono text-[#102B50]">
                  {activeItem.value} {unit}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                  Selected
                </span>
              </div>
            ) : (
              <div className="animate-in fade-in duration-150 flex flex-col items-center justify-center">
                <span className="text-2xl font-black font-mono tracking-tight text-[#102B50]">
                  {total}
                </span>
                <span className="text-[11px] font-bold text-slate-600">
                  {unit}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                  {totalLabel}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Clean, Full-Text Legend Rows */}
        <div className="flex-1 w-full space-y-2 min-w-0">
          {slices.map((slice, idx) => (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`px-3 py-2 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all duration-200 border ${
                hoveredIndex === idx
                  ? 'bg-[#EAF5FF] border-[#C5DFF5] shadow-xs scale-[1.01]'
                  : 'bg-[#F8FBFF] border-slate-100 hover:bg-slate-100/70 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white shadow-2xs"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="text-xs font-semibold text-slate-800 leading-snug">
                  {slice.label}
                </span>
              </div>

              <div className="flex items-center space-x-2 shrink-0 font-mono text-xs pl-2">
                <span className="font-bold text-slate-900">{slice.value}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                    hoveredIndex === idx
                      ? 'bg-[#0878C9] text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  {slice.percent}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 2. EXTRAORDINARY INTERACTIVE VERTICAL BAR CHART COMPONENT
// ============================================================================
export const BarChartCard = ({
  title,
  subtitle,
  data = [],
  yAxisLabel = 'Total Count',
  customWidth = null
}) => {
  const [hoveredBar, setHoveredBar] = useState(null);

  const maxValue = Math.max(...data.map((d) => Number(d.value) || 0), 5);
  const chartHeight = 240;
  const chartWidth = customWidth || (data.length > 7 ? 760 : 560);
  const paddingLeft = 52;
  const paddingBottom = 48;
  const paddingTop = 28;
  const paddingRight = 24;

  const innerHeight = chartHeight - paddingTop - paddingBottom;
  const innerWidth = chartWidth - paddingLeft - paddingRight;

  const barWidth = Math.max(22, Math.min(44, innerWidth / (data.length * 1.5)));
  const gap = (innerWidth - data.length * barWidth) / (data.length + 1);

  // 4 Horizontal Y-ticks
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    value: Math.round(maxValue * pct),
    y: paddingTop + innerHeight * (1 - pct)
  }));

  return (
    <div
      className="bg-white p-5 sm:p-6 rounded-2xl border transition-all"
      style={{
        borderColor: '#DFEAF6',
        boxShadow: '0 3px 8px rgba(15, 55, 100, 0.05)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-3 border-b" style={{ borderColor: '#EAF0F7' }}>
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF7A18' }} />
            <h3 className="text-base font-bold" style={{ color: '#102B50' }}>{title}</h3>
          </div>
          {subtitle && <p className="text-xs text-slate-500 font-medium mt-1">{subtitle}</p>}
        </div>
        <span
          className="text-xs font-bold px-3 py-1 rounded-full border shrink-0"
          style={{ background: '#FFF0E3', color: '#FF7A18', borderColor: '#FFD4A8' }}
        >
          {yAxisLabel}
        </span>
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto overflow-hidden select-none"
        >
          {/* Horizontal Gridlines */}
          {ticks.map((tick, i) => (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={tick.y}
                x2={chartWidth - paddingRight}
                y2={tick.y}
                stroke="#E2E8F0"
                strokeDasharray={i === 0 ? 'none' : '3 3'}
                strokeWidth={i === 0 ? '1.5' : '1'}
              />
              <text
                x={paddingLeft - 10}
                y={tick.y + 4}
                textAnchor="end"
                className="text-[11px] fill-slate-500 font-mono font-bold"
              >
                {tick.value}
              </text>
            </g>
          ))}

          {/* Background Track + Vertical Columns */}
          {data.map((item, idx) => {
            const val = Number(item.value) || 0;
            const barHeight = maxValue > 0 ? (val / maxValue) * innerHeight : 0;
            const x = paddingLeft + gap + idx * (barWidth + gap);
            const y = paddingTop + innerHeight - barHeight;
            const isHovered = hoveredBar === idx;

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredBar(idx)}
                onMouseLeave={() => setHoveredBar(null)}
                className="cursor-pointer"
              >
                {/* Subtle Background Track Column (Shows Depth) */}
                <rect
                  x={x}
                  y={paddingTop}
                  width={barWidth}
                  height={innerHeight}
                  rx="6"
                  ry="6"
                  fill="#F8FAFC"
                  className="transition-colors"
                />

                {/* Active Colored Column with rounded top */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barHeight, 4)}
                  rx="6"
                  ry="6"
                  fill={isHovered ? '#EE6F2D' : item.color || '#1E5BB8'}
                  className="transition-all duration-300"
                  style={{
                    filter: isHovered
                      ? 'drop-shadow(0 8px 18px rgba(238, 111, 45, 0.45))'
                      : 'drop-shadow(0 2px 4px rgba(15, 23, 42, 0.08))'
                  }}
                />

                {/* Top Value Tag */}
                {val > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 8}
                    textAnchor="middle"
                    className={`font-mono text-xs font-black transition-all ${
                      isHovered ? 'fill-[#EE6F2D] text-sm' : 'fill-slate-800'
                    }`}
                  >
                    {val}
                  </text>
                )}

                {/* X-axis Stage Label */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - 14}
                  textAnchor="middle"
                  className={`text-[11px] font-bold transition-colors ${
                    isHovered ? 'fill-[#1E5BB8] font-extrabold' : 'fill-slate-600'
                  }`}
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Floating Details Card */}
        {hoveredBar !== null && data[hoveredBar] && (
          <div className="mt-3 p-3.5 bg-[#0A101D] text-white rounded-xl text-xs flex items-center justify-between shadow-xl border border-slate-800 animate-in fade-in">
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EE6F2D]" />
              <span className="font-bold text-slate-200">
                Stage: <strong className="text-white">{data[hoveredBar].fullName || data[hoveredBar].label}</strong>
              </span>
            </div>
            <div className="font-mono text-sm font-extrabold text-[#EE6F2D]">
              {data[hoveredBar].value} {data[hoveredBar].unit || 'Projects'}
              {data[hoveredBar].extra && ` • ₹ ${Number(data[hoveredBar].extra).toLocaleString('en-IN')}`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 3. EXTRAORDINARY INTERACTIVE LINE & SPLINE AREA GRAPH (PREMIUM EXECUTIVE FINTECH GRADE)
// ============================================================================
export const TrendLineGraphCard = ({
  title = 'Monthly Revenue & Commercial Trajectory',
  subtitle = 'Gross switchgear requirement value compared against actual confirmed order conversions',
  data = []
}) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [activeSeries, setActiveSeries] = useState('both'); // 'both' | 'pipeline' | 'won'
  const [activeTimeframe, setActiveTimeframe] = useState('6M');
  const [chartMode, setChartMode] = useState('combo'); // 'combo' | 'spline' | 'bars'

  // Default high-fidelity switchgear manufacturing dataset with authentic seasonal variance
  const fallbackData = [
    { month: 'Jun', period: 'Jun 2026', enquiries: 4, pipelineValue: 3850000, wonValue: 1620000, conversionYield: 42, topEquipment: '11kV VCB Indoor Panel' },
    { month: 'Jul', period: 'Jul 2026', enquiries: 6, pipelineValue: 5840000, wonValue: 2850000, conversionYield: 49, topEquipment: '22kV Outdoor Kiosk' },
    { month: 'Aug', period: 'Aug 2026', enquiries: 5, pipelineValue: 4620000, wonValue: 2280000, conversionYield: 49, topEquipment: '415V LT MCC Switchboard' },
    { month: 'Sep', period: 'Sep 2026', enquiries: 8, pipelineValue: 7890000, wonValue: 4150000, conversionYield: 53, topEquipment: '33kV Substation Breaker' },
    { month: 'Oct', period: 'Oct 2026', enquiries: 7, pipelineValue: 6530000, wonValue: 3240000, conversionYield: 50, topEquipment: '11kV Feeder Breaker Panel' },
    { month: 'Nov', period: 'Nov 2026', enquiries: 10, pipelineValue: 9840000, wonValue: 4820000, conversionYield: 49, topEquipment: '11kV Campus Substation' }
  ];

  const sourceData = data && data.length > 0 ? data : fallbackData;

  const chartHeight = 310;
  const chartWidth = 780;
  const paddingLeft = 78;
  const paddingBottom = 46;
  const paddingTop = 36;
  const paddingRight = 36;

  const innerHeight = chartHeight - paddingTop - paddingBottom;
  const innerWidth = chartWidth - paddingLeft - paddingRight;

  const maxVal = Math.max(
    ...sourceData.map((d) => Math.max(Number(d.pipelineValue) || 0, Number(d.wonValue) || 0)),
    1000000
  );
  const maxEnquiries = Math.max(...sourceData.map((d) => Number(d.enquiries) || 1), 5);
  const stepX = innerWidth / (sourceData.length - 1 || 1);

  const points = sourceData.map((d, i) => {
    const x = paddingLeft + i * stepX;
    const y = paddingTop + innerHeight - ((Number(d.pipelineValue) || 0) / maxVal) * innerHeight;
    const wonY = paddingTop + innerHeight - ((Number(d.wonValue) || 0) / maxVal) * innerHeight;
    const volumeHeight = ((Number(d.enquiries) || 0) / maxEnquiries) * (innerHeight * 0.42);
    return {
      ...d,
      x,
      y,
      wonY,
      volumeHeight,
      index: i
    };
  });

  // Latest & Peak metrics
  const latestPoint = points[points.length - 1] || {};
  const peakPoint = points.reduce((prev, curr) => ((curr.pipelineValue || 0) > (prev.pipelineValue || 0) ? curr : prev), points[0] || {});
  const currentPipeline = Number(latestPoint.pipelineValue || 9840000);
  const currentWon = Number(latestPoint.wonValue || 4820000);
  const currentEnquiries = latestPoint.enquiries || 10;
  const currentYield = Math.round((currentWon / (currentPipeline || 1)) * 100);

  // Smooth spline Bézier curve generator
  const buildSmoothPath = (pts, keyY = 'y') => {
    if (pts.length === 0) return '';
    let path = `M ${pts[0].x} ${pts[0][keyY]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const mx = (p0.x + p1.x) / 2;
      path += ` C ${mx} ${p0[keyY]}, ${mx} ${p1[keyY]}, ${p1.x} ${p1[keyY]}`;
    }
    return path;
  };

  const linePath = buildSmoothPath(points, 'y');
  const wonLinePath = buildSmoothPath(points, 'wonY');

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + innerHeight} L ${points[0].x} ${paddingTop + innerHeight} Z`
      : '';

  const wonAreaPath =
    points.length > 0
      ? `${wonLinePath} L ${points[points.length - 1].x} ${paddingTop + innerHeight} L ${points[0].x} ${paddingTop + innerHeight} Z`
      : '';

  // 5 Clean Y-Ticks formatted in ₹ Lakhs / Crores
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => {
    const rawVal = maxVal * pct;
    const label =
      rawVal >= 10000000
        ? `₹ ${(rawVal / 10000000).toFixed(1)} Cr`
        : rawVal >= 100000
        ? `₹ ${(rawVal / 100000).toFixed(0)} L`
        : `₹ ${rawVal}`;
    return {
      label,
      y: paddingTop + innerHeight * (1 - pct)
    };
  });

  return (
    <div
      className="bg-white p-5 sm:p-6 rounded-2xl border relative overflow-hidden transition-all"
      style={{
        borderColor: '#DFEAF6',
        boxShadow: '0 3px 8px rgba(15, 55, 100, 0.05), 0 10px 24px rgba(15, 55, 100, 0.07)'
      }}
    >
      {/* Decorative top border ambient highlight */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0878C9] via-[#FF7A18] to-[#16A34A]" />

      {/* 1. Header with Title & Interactive Control Center */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 pb-4 border-b" style={{ borderColor: '#EAF0F7' }}>
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: '#0878C9' }} />
            <h3 className="text-base font-bold tracking-tight" style={{ color: '#102B50' }}>{title}</h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Trajectory
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">{subtitle}</p>
        </div>

        {/* Series Filter Toggles & Visual Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Chart Visual Mode Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1 border border-slate-200 text-[11px] font-bold">
            {[
              { id: 'combo', label: 'Combo (Area + Vol)' },
              { id: 'spline', label: 'Neon Spline' },
              { id: 'bars', label: 'Monthly Bars' }
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setChartMode(m.id)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  chartMode === m.id
                    ? 'bg-white text-[#1E3A5F] shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Series Toggles */}
          <div className="flex items-center gap-1.5 text-xs font-bold bg-slate-50 p-1 rounded-xl border border-slate-200/70">
            <button
              type="button"
              onClick={() => setActiveSeries('both')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSeries === 'both'
                  ? 'bg-[#1E3A5F] text-white shadow-xs font-extrabold'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              All Series
            </button>

            <button
              type="button"
              onClick={() => setActiveSeries(activeSeries === 'pipeline' ? 'both' : 'pipeline')}
              className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSeries === 'pipeline'
                  ? 'bg-[#1E5BB8] text-white shadow-xs'
                  : 'text-[#1E5BB8] hover:bg-blue-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#1E5BB8] ring-2 ring-white" />
              <span>Gross Pipeline (₹)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSeries(activeSeries === 'won' ? 'both' : 'won')}
              className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSeries === 'won'
                  ? 'bg-[#059669] text-white shadow-xs'
                  : 'text-[#059669] hover:bg-emerald-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#059669] ring-2 ring-white" />
              <span>Orders Won (₹)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Executive Stat HUD Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-3.5 my-2 border-b border-slate-100 bg-slate-50/60 -mx-6 px-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Gross Pipeline
          </span>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-lg sm:text-xl font-bold font-mono text-[#102B50] whitespace-nowrap">
              ₹ {currentPipeline.toLocaleString('en-IN')}
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              <TrendingUp className="w-2.5 h-2.5 mr-0.5 text-emerald-600" />
              +28%
            </span>
          </div>
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Realized Value
          </span>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-lg sm:text-xl font-bold font-mono text-emerald-700 whitespace-nowrap">
              ₹ {currentWon.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
              {currentYield}% Yield
            </span>
          </div>
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Active RFQs
          </span>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-lg sm:text-xl font-bold font-mono text-[#0878C9] whitespace-nowrap">
              {currentEnquiries} Requisitions
            </span>
            <span className="text-[10px] font-bold text-slate-500 shrink-0">Active</span>
          </div>
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Peak Month
          </span>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-lg sm:text-xl font-bold font-mono text-[#102B50] whitespace-nowrap">
              {peakPoint.month} 2026
            </span>
            <span className="text-[10px] font-bold text-[#0878C9] font-mono shrink-0">
              ₹ {(Number(peakPoint.pipelineValue) / 100000).toFixed(1)} L Peak
            </span>
          </div>
        </div>
      </div>

      {/* 3. High-Aesthetic Interactive SVG Canvas */}
      <div className="relative w-full overflow-x-auto pt-3">
        {/* Floating Glassmorphic Tooltip */}
        {hoveredPoint !== null && points[hoveredPoint] && (
          <div
            className="absolute z-20 pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95"
            style={{
              left: `${(points[hoveredPoint].x / chartWidth) * 100}%`,
              top: '10px',
              transform: 'translateX(-50%)'
            }}
          >
            <div className="bg-[#0A101D]/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 ring-1 ring-white/10 min-w-[250px]">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#EE6F2D]" />
                  <span>{points[hoveredPoint].period || `${points[hoveredPoint].month} 2026`}</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-extrabold">
                  {points[hoveredPoint].enquiries} RFQs Quoted
                </span>
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-[#3B82F6] mr-1.5" />
                    Gross Pipeline:
                  </span>
                  <span className="font-bold text-white text-sm">
                    ₹ {Number(points[hoveredPoint].pipelineValue || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-[#10B981] mr-1.5" />
                    Realized Orders:
                  </span>
                  <span className="font-bold text-emerald-300 text-sm">
                    ₹ {Number(points[hoveredPoint].wonValue || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
                  <span className="text-slate-400">Realization Yield:</span>
                  <span className="font-extrabold text-[#EE6F2D]">
                    {points[hoveredPoint].conversionYield || Math.round((points[hoveredPoint].wonValue / (points[hoveredPoint].pipelineValue || 1)) * 100)}%
                  </span>
                </div>
                {points[hoveredPoint].topEquipment && (
                  <div className="text-[10px] text-slate-400 pt-0.5 truncate">
                    Lead Spec: <strong className="text-slate-200">{points[hoveredPoint].topEquipment}</strong>
                  </div>
                )}
              </div>
            </div>
            {/* Tooltip Downward Caret */}
            <div className="w-3 h-3 bg-[#0A101D] border-b border-r border-slate-700 transform rotate-45 mx-auto -mt-1.5" />
          </div>
        )}

        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto overflow-hidden select-none drop-shadow-xs"
        >
          <defs>
            {/* Ultra-smooth multi-stop area glow gradient */}
            <linearGradient id="pipelineAreaGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1E5BB8" stopOpacity="0.35" />
              <stop offset="45%" stopColor="#3B82F6" stopOpacity="0.14" />
              <stop offset="85%" stopColor="#93C5FD" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
            </linearGradient>

            {/* Won Orders area glow gradient */}
            <linearGradient id="wonAreaGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.28" />
              <stop offset="50%" stopColor="#10B981" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
            </linearGradient>

            {/* Glowing stroke gradients */}
            <linearGradient id="pipelineStrokeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1E5BB8" />
              <stop offset="50%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>

            <linearGradient id="wonStrokeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="50%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>

            {/* Bar Gradients */}
            <linearGradient id="barPipelineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#1E5BB8" />
            </linearGradient>

            <linearGradient id="barWonGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            <filter id="neonStrokeShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#1E5BB8" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Horizontal Gridlines with Subtle Tint */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={tick.y}
                x2={chartWidth - paddingRight}
                y2={tick.y}
                stroke="#E2E8F0"
                strokeDasharray={i === 0 ? 'none' : '4 6'}
                strokeWidth={i === 0 ? '1.5' : '1'}
                strokeOpacity={i === 0 ? '0.9' : '0.7'}
              />
              <text
                x={paddingLeft - 14}
                y={tick.y + 4}
                textAnchor="end"
                className="text-[11px] fill-slate-400 font-mono font-bold select-none"
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* MODE 1 & 3: Shaded Volume Pillars (Combo Mode) */}
          {(chartMode === 'combo' || chartMode === 'bars') &&
            points.map((p, idx) => {
              const barW = chartMode === 'bars' ? 18 : 34;
              return (
                <g key={`vol-${idx}`}>
                  {chartMode === 'combo' ? (
                    // Subtle background volume pillars indicating RFQ count
                    <rect
                      x={p.x - barW / 2}
                      y={paddingTop + innerHeight - p.volumeHeight}
                      width={barW}
                      height={p.volumeHeight}
                      rx="4"
                      fill="#3B82F6"
                      opacity="0.10"
                      className="transition-all"
                    />
                  ) : (
                    // Grouped bars: Pipeline + Won side-by-side
                    <g>
                      {/* Pipeline Bar */}
                      <rect
                        x={p.x - 22}
                        y={p.y}
                        width="18"
                        height={paddingTop + innerHeight - p.y}
                        rx="4"
                        fill="url(#barPipelineGrad)"
                        opacity={hoveredPoint === null || hoveredPoint === idx ? 0.95 : 0.4}
                        className="transition-all duration-200"
                      />
                      {/* Won Bar */}
                      <rect
                        x={p.x + 2}
                        y={p.wonY}
                        width="18"
                        height={paddingTop + innerHeight - p.wonY}
                        rx="4"
                        fill="url(#barWonGrad)"
                        opacity={hoveredPoint === null || hoveredPoint === idx ? 0.95 : 0.4}
                        className="transition-all duration-200"
                      />
                    </g>
                  )}
                </g>
              );
            })}

          {/* Area Fill for Orders Won (Spline / Combo Mode) */}
          {(chartMode === 'combo' || chartMode === 'spline') &&
            (activeSeries === 'both' || activeSeries === 'won') &&
            wonAreaPath && (
              <path d={wonAreaPath} fill="url(#wonAreaGlow)" className="transition-all duration-300" />
            )}

          {/* Area Fill for Pipeline (Spline / Combo Mode) */}
          {(chartMode === 'combo' || chartMode === 'spline') &&
            (activeSeries === 'both' || activeSeries === 'pipeline') &&
            areaPath && (
              <path d={areaPath} fill="url(#pipelineAreaGlow)" className="transition-all duration-300" />
            )}

          {/* Won Orders Spline Line */}
          {(chartMode === 'combo' || chartMode === 'spline') &&
            (activeSeries === 'both' || activeSeries === 'won') &&
            wonLinePath && (
              <path
                d={wonLinePath}
                fill="none"
                stroke="url(#wonStrokeGrad)"
                strokeWidth="2.75"
                strokeDasharray="6 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

          {/* Pipeline Spline Line with Neon Ambient Shadow */}
          {(chartMode === 'combo' || chartMode === 'spline') &&
            (activeSeries === 'both' || activeSeries === 'pipeline') &&
            linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="url(#pipelineStrokeGrad)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#neonStrokeShadow)"
              />
            )}

          {/* Peak Callout Badge above highest pipeline point */}
          {peakPoint && (
            <g transform={`translate(${peakPoint.x}, ${peakPoint.y - 18})`}>
              <rect
                x="-36"
                y="-18"
                width="72"
                height="18"
                rx="9"
                fill="#0A101D"
                stroke="#1E5BB8"
                strokeWidth="1.5"
              />
              <text
                x="0"
                y="-6"
                textAnchor="middle"
                className="text-[10px] font-mono font-black fill-[#EE6F2D]"
              >
                ₹ {(peakPoint.pipelineValue / 100000).toFixed(1)} L Peak
              </text>
            </g>
          )}

          {/* Interactive Crosshair & Nodes */}
          {points.map((p, idx) => {
            const isHovered = hoveredPoint === idx;
            const isPeak = p.month === peakPoint.month;

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredPoint(idx)}
                onMouseLeave={() => setHoveredPoint(null)}
                className="cursor-pointer group"
              >
                {/* Invisible large touch target */}
                <rect
                  x={p.x - stepX / 2}
                  y={paddingTop}
                  width={stepX}
                  height={innerHeight}
                  fill="transparent"
                />

                {/* Vertical Crosshair Guide */}
                {isHovered && (
                  <line
                    x1={p.x}
                    y1={paddingTop}
                    x2={p.x}
                    y2={paddingTop + innerHeight}
                    stroke="#1E5BB8"
                    strokeWidth="1.75"
                    strokeDasharray="3 3"
                    opacity="0.8"
                  />
                )}

                {/* Won Dot */}
                {(chartMode === 'combo' || chartMode === 'spline') &&
                  (activeSeries === 'both' || activeSeries === 'won') && (
                    <g>
                      {isHovered && (
                        <circle cx={p.x} cy={p.wonY} r={11} fill="#10B981" opacity="0.25" />
                      )}
                      <circle
                        cx={p.x}
                        cy={p.wonY}
                        r={isHovered ? 6 : 4}
                        fill="#FFFFFF"
                        stroke="#059669"
                        strokeWidth="2.5"
                        className="transition-all duration-200"
                      />
                    </g>
                  )}

                {/* Pipeline Dot with Concentric Radar Halo */}
                {(chartMode === 'combo' || chartMode === 'spline') &&
                  (activeSeries === 'both' || activeSeries === 'pipeline') && (
                    <g>
                      {/* Radar ring on hover or peak point */}
                      {(isHovered || isPeak) && (
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={isHovered ? 14 : 9}
                          fill="#3B82F6"
                          opacity={isHovered ? 0.3 : 0.15}
                          className={isPeak && !isHovered ? 'animate-pulse' : ''}
                        />
                      )}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isHovered ? 6.5 : 4.5}
                        fill="#FFFFFF"
                        stroke="#1E5BB8"
                        strokeWidth="3"
                        className="transition-all duration-200"
                      />
                    </g>
                  )}

                {/* Month Label on X-axis */}
                <text
                  x={p.x}
                  y={chartHeight - 12}
                  textAnchor="middle"
                  className={`text-xs font-bold transition-all duration-200 ${
                    isHovered
                      ? 'fill-[#1E5BB8] font-black text-sm'
                      : isPeak
                      ? 'fill-slate-900 font-extrabold'
                      : 'fill-slate-500'
                  }`}
                >
                  {p.month}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 4. Bottom Engineering Telemetry Footer */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 font-medium gap-3">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>
            Current Run-Rate:{' '}
            <strong className="text-slate-800">
              {latestPoint.month} 2026 (₹ {currentPipeline.toLocaleString('en-IN')})
            </strong>
          </span>
          <span className="text-slate-300">•</span>
          <span className="font-mono text-emerald-700 font-bold">
            Realized: ₹ {currentWon.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <span className="inline-flex items-center text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-blue-600" />
            ISO 9001:2015 &amp; CPRI Type Tested Verification
          </span>
          <span className="text-slate-300">•</span>
          <span className="font-mono font-bold text-slate-700">
            Annualized Target: ₹ 1.25 Cr
          </span>
        </div>
      </div>
    </div>
  );
};
