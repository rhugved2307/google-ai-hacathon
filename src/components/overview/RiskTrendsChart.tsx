import { useMemo, useState } from 'react';

export type TrendScope = 'categories' | 'severity' | 'session';

export interface ChartDataPoint {
  readonly label: string;
  readonly value: number;
  readonly sublabel: string;
}

interface RiskTrendsChartProps {
  trendScope: TrendScope;
  onChangeTrendScope: (scope: TrendScope) => void;
  points: ChartDataPoint[];
}

const SCOPE_OPTIONS: ReadonlyArray<{ readonly id: TrendScope; readonly label: string }> = [
  { id: 'categories', label: 'Categories' },
  { id: 'severity', label: 'All Samples' },
  { id: 'session', label: 'Session' },
];

const SVG_WIDTH = 640;
const SVG_HEIGHT = 200;
const PAD_LEFT = 36;
const PAD_RIGHT = 24;
const PAD_TOP = 28;
const PAD_BOTTOM = 18;
const PLOT_W = SVG_WIDTH - PAD_LEFT - PAD_RIGHT;
const PLOT_H = SVG_HEIGHT - PAD_TOP - PAD_BOTTOM;

export function RiskTrendsChart({
  trendScope,
  onChangeTrendScope,
  points,
}: RiskTrendsChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const peakIndex = useMemo(() => {
    let bestIdx = 0;
    let bestVal = -1;
    points.forEach((p, idx) => {
      if (p.value > bestVal) {
        bestVal = p.value;
        bestIdx = idx;
      }
    });
    return bestIdx;
  }, [points]);

  const activePointIndex =
    hoveredIndex !== null && hoveredIndex < points.length ? hoveredIndex : peakIndex;

  const { coords, linePath, areaPath, niceMax } = useMemo(() => {
    const maxVal = Math.max(10, ...points.map((p) => p.value));
    const computedNiceMax = Math.ceil(maxVal / 5) * 5;

    const mapped = points.map((pt, i) => {
      const x =
        points.length > 1
          ? PAD_LEFT + (i / (points.length - 1)) * PLOT_W
          : PAD_LEFT + PLOT_W / 2;
      const y = PAD_TOP + PLOT_H - (pt.value / computedNiceMax) * PLOT_H;
      return { ...pt, x, y };
    });

    const line = mapped
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
      .join(' ');
    const area =
      mapped.length > 0
        ? `${line} L ${mapped[mapped.length - 1].x.toFixed(1)} ${(PAD_TOP + PLOT_H).toFixed(1)} L ${mapped[0].x.toFixed(1)} ${(PAD_TOP + PLOT_H).toFixed(1)} Z`
        : '';

    return { coords: mapped, linePath: line, areaPath: area, niceMax: computedNiceMax };
  }, [points]);

  const activeCoord = coords[activePointIndex] ?? coords[0];

  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">Risk Trends</h2>

        <div className="flex items-center gap-3 text-xs">
          {SCOPE_OPTIONS.map((item) => {
            const active = trendScope === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onChangeTrendScope(item.id);
                  setHoveredIndex(null);
                }}
                className={`font-medium transition-colors ${
                  active
                    ? 'text-slate-900 dark:text-[#F8FAFC]'
                    : 'text-slate-400 hover:text-slate-700 dark:text-[#7A7599] dark:hover:text-[#CBD5E1]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5 dark:border-white/[0.06] dark:bg-[#171232]/85">
        {activeCoord && (
          <div
            className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-center shadow-lg transition-all duration-150 dark:border-white/10 dark:bg-[#1E1A36]"
            style={{ left: `${(activeCoord.x / SVG_WIDTH) * 100}%` }}
          >
            <p className="text-[10px] font-medium text-slate-500 dark:text-[#94A3B8]">Findings</p>
            <p className="font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-[#F8FAFC]">
              {activeCoord.value}
            </p>
          </div>
        )}

        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="mt-6 h-[185px] w-full overflow-visible"
          role="img"
          aria-label="Interactive PII detection distribution chart"
        >
          <defs>
            <linearGradient id="veltrixAreaFill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
            const y = PAD_TOP + PLOT_H * (1 - frac);
            const val = Math.round(niceMax * frac);
            return (
              <g key={frac}>
                <line
                  x1={PAD_LEFT}
                  y1={y}
                  x2={SVG_WIDTH - PAD_RIGHT}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-slate-200 dark:text-white/[0.06]"
                />
                <text
                  x={PAD_LEFT - 10}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-slate-400 font-mono text-[10px] dark:fill-[#7B7699]"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {areaPath && <path d={areaPath} fill="url(#veltrixAreaFill)" />}

          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#7C6DF2"
              strokeWidth="2.2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {activeCoord && (
            <g>
              <line
                x1={activeCoord.x}
                y1={activeCoord.y}
                x2={activeCoord.x}
                y2={PAD_TOP + PLOT_H}
                stroke="#8B5CF6"
                strokeWidth="2"
              />
              <circle cx={activeCoord.x} cy={activeCoord.y} r="8" fill="#8B5CF6" opacity="0.28" />
              <circle
                cx={activeCoord.x}
                cy={activeCoord.y}
                r="3.5"
                fill="#E9D5FF"
                stroke="#8B5CF6"
                strokeWidth="2"
              />
            </g>
          )}

          {coords.map((pt, idx) => (
            <rect
              key={`${pt.label}-${idx}`}
              x={pt.x - 28}
              y={PAD_TOP}
              width={56}
              height={PLOT_H + 16}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(idx)}
              onClick={() => setHoveredIndex(idx)}
            />
          ))}
        </svg>

        <div
          className={`mt-2 flex items-center gap-1 px-2 ${
            coords.length === 1 ? 'justify-center' : 'justify-between'
          }`}
        >
          {coords.map((pt, idx) => {
            const isActive = idx === activePointIndex;
            return (
              <button
                key={`${pt.label}-${idx}`}
                type="button"
                onClick={() => setHoveredIndex(idx)}
                onMouseEnter={() => setHoveredIndex(idx)}
                className={`truncate rounded-full px-2.5 py-0.5 font-mono text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'bg-[#7C5CFC] text-white shadow-sm shadow-[#7C5CFC]/40'
                    : 'text-slate-500 hover:text-slate-900 dark:text-[#8E89AC] dark:hover:text-[#F8FAFC]'
                }`}
              >
                {pt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
