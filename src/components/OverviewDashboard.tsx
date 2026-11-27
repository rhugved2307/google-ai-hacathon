import {
  AlertCircle,
  ArrowUpRight,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  ScanSearch,
  SlidersHorizontal,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { scanAndSanitizeCSV } from '../engine/csvSanitizer';
import { DEMO_CSV_SAMPLE, DEMO_TEXT_SAMPLE } from '../engine/demoData';
import { scanAndSanitizeText } from '../engine/detector';
import {
  CATEGORY_META,
  getDefaultCustomReplacements,
  getDefaultEnabledCategories,
} from '../engine/patterns';
import type {
  CSVScanResult,
  PIICategory,
  ScanResult,
  SessionHistoryEntry,
  UploadedFileInfo,
} from '../engine/types';

interface OverviewDashboardProps {
  hasScanned: boolean;
  scanResult: ScanResult | null;
  csvResult: CSVScanResult | null;
  uploadedFile: UploadedFileInfo | null;
  sessionHistory: SessionHistoryEntry[];
  searchQuery: string;
  onOpenWorkspace: () => void;
  onLoadAndScanPreset: (preset: 'demo-text' | 'demo-csv' | 'support-log' | 'hr-export') => void;
  onOpenSettings: () => void;
}

export const SUPPORT_LOG_PRESET = `[2026-11-26 14:22:08] Ticket #4821
Customer: Priya Deshmukh
Email: priya.deshmukh@company.co.in
Backup Email: priya.d@gmail.com
Phone: +91 9823456789
Client IP: 192.168.14.88
UPI Refund Handle: priya@okhdfcbank
Card Verification: 4111 1111 1111 1111
Address: Flat 4B, Green Apartments, Pune`;

export const HR_EXPORT_PRESET = `Employee Onboarding Record (Fictional Sample)
Name: Mr. Amit Patil
Date of Birth: 14/08/1996
Email: amit.patil@enterprise.co.in
Phone: 9765432109
PAN: BCPDE4321K
Aadhaar: 2345 6789 0123
Bank Account Number: 551009872341
Passport: K8765432
PIN Code: 400001`;

interface RiskDatasetCard {
  id: string;
  presetKey?: 'demo-text' | 'demo-csv' | 'support-log' | 'hr-export';
  name: string;
  updatedLabel: string;
  severity: 'critical' | 'warning';
  line1: string;
  line2: string;
  totalFindings: number;
  isLiveCurrent?: boolean;
}

export function OverviewDashboard({
  hasScanned,
  scanResult,
  csvResult,
  uploadedFile,
  sessionHistory,
  searchQuery,
  onOpenWorkspace,
  onLoadAndScanPreset,
  onOpenSettings,
}: OverviewDashboardProps) {
  const [trendScope, setTrendScope] = useState<'categories' | 'severity' | 'session'>('categories');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [collapsedRiskList, setCollapsedRiskList] = useState(false);

  // Run lightweight deterministic local scans on the fictional sample presets so the first page displays 100% real engine counts
  const presetSummaries = useMemo(() => {
    const opts = {
      redactionMode: 'full' as const,
      customReplacements: getDefaultCustomReplacements(),
      enabledCategories: getDefaultEnabledCategories(),
      customRules: [],
    };
    const demoText = scanAndSanitizeText(DEMO_TEXT_SAMPLE, opts);
    const demoCsv = scanAndSanitizeCSV(DEMO_CSV_SAMPLE, opts);
    const supportLog = scanAndSanitizeText(SUPPORT_LOG_PRESET, opts);
    const hrExport = scanAndSanitizeText(HR_EXPORT_PRESET, opts);
    return { demoText, demoCsv, supportLog, hrExport };
  }, []);

  // Build "Data at risk" cards (showing live active workspace scan on top if scanned, followed by interactive sample datasets)
  const riskCards: RiskDatasetCard[] = useMemo(() => {
    const cards: RiskDatasetCard[] = [];

    if (hasScanned && scanResult && scanResult.stats.totalDetections > 0) {
      const top1 = scanResult.categoryStats[0];
      const top2 = scanResult.categoryStats[1];
      cards.push({
        id: 'current-active',
        name: uploadedFile?.name || (csvResult ? 'active-csv-dataset' : 'active-workspace-text'),
        updatedLabel: 'Just now',
        severity: scanResult.stats.totalDetections >= 8 ? 'critical' : 'warning',
        line1: top1
          ? `${CATEGORY_META[top1.category].label}s (${top1.count})`
          : `Total Findings (${scanResult.stats.totalDetections})`,
        line2: top2
          ? `${CATEGORY_META[top2.category].label}s (${top2.count})`
          : `Characters sanitized (${scanResult.stats.charactersSanitized})`,
        totalFindings: scanResult.stats.totalDetections,
        isLiveCurrent: true,
      });
    }

    const csvTop = presetSummaries.demoCsv.aggregateResult.categoryStats;
    cards.push({
      id: 'preset-demo-csv',
      presetKey: 'demo-csv',
      name: 'customer-files-sample.csv',
      updatedLabel: 'Sample CSV',
      severity: 'critical',
      line1: `Emails (${csvTop.find((c) => c.category === 'EMAIL')?.count ?? 4}) · Phones (${csvTop.find((c) => c.category === 'PHONE')?.count ?? 4})`,
      line2: `PAN & UPI identifiers (${(csvTop.find((c) => c.category === 'PAN')?.count ?? 4) + (csvTop.find((c) => c.category === 'UPI')?.count ?? 4)})`,
      totalFindings: presetSummaries.demoCsv.aggregateResult.stats.totalDetections,
    });

    cards.push({
      id: 'preset-demo-text',
      presetKey: 'demo-text',
      name: 'customer-kyc-profile.txt',
      updatedLabel: 'Sample TXT',
      severity: 'critical',
      line1: `Identity IDs (${presetSummaries.demoText.detections.filter((d) => ['AADHAAR', 'PAN', 'PASSPORT'].includes(d.type)).length}) · Financial (${presetSummaries.demoText.detections.filter((d) => ['CARD', 'UPI', 'BANK_ACCOUNT'].includes(d.type)).length})`,
      line2: `Total sensitive fields (${presetSummaries.demoText.stats.totalDetections})`,
      totalFindings: presetSummaries.demoText.stats.totalDetections,
    });

    cards.push({
      id: 'preset-support-log',
      presetKey: 'support-log',
      name: 'support-ticket-4821.log',
      updatedLabel: 'Sample Log',
      severity: 'warning',
      line1: `Emails (${presetSummaries.supportLog.detections.filter((d) => d.type === 'EMAIL').length}) · Payment details (${presetSummaries.supportLog.detections.filter((d) => ['CARD', 'UPI'].includes(d.type)).length})`,
      line2: `IP & Contact records (${presetSummaries.supportLog.detections.filter((d) => ['IP_ADDRESS', 'PHONE', 'ADDRESS'].includes(d.type)).length})`,
      totalFindings: presetSummaries.supportLog.stats.totalDetections,
    });

    cards.push({
      id: 'preset-hr-export',
      presetKey: 'hr-export',
      name: 'hr-onboarding-record.txt',
      updatedLabel: 'Sample HR',
      severity: 'warning',
      line1: `Government IDs (${presetSummaries.hrExport.detections.filter((d) => ['AADHAAR', 'PAN', 'PASSPORT'].includes(d.type)).length})`,
      line2: `Bank & DOB fields (${presetSummaries.hrExport.detections.filter((d) => ['BANK_ACCOUNT', 'DOB', 'PIN_CODE'].includes(d.type)).length})`,
      totalFindings: presetSummaries.hrExport.stats.totalDetections,
    });

    const q = searchQuery.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.line1.toLowerCase().includes(q) ||
        c.line2.toLowerCase().includes(q)
    );
  }, [hasScanned, scanResult, csvResult, uploadedFile, presetSummaries, searchQuery]);

  // Compute real hero card metrics (Left Orb Card + Right Cyber Risk Score Gauge)
  const primaryMetricValue = hasScanned && scanResult
    ? scanResult.stats.charactersSanitized
    : presetSummaries.demoCsv.aggregateResult.stats.charactersSanitized +
      presetSummaries.demoText.stats.charactersSanitized;

  const primaryMetricHeading = hasScanned ? 'Characters Sanitized' : 'Protected Characters';

  // Compute exposure / risk score (0-100%)
  const riskScorePct = useMemo(() => {
    if (!hasScanned || !scanResult) return 21; // Baseline clean readiness index
    const total = scanResult.stats.totalDetections;
    if (total === 0) return 0;
    const criticalCount = scanResult.detections.filter((d) =>
      ['AADHAAR', 'PAN', 'CARD', 'BANK_ACCOUNT', 'PASSPORT'].includes(d.type)
    ).length;
    return Math.min(98, Math.max(12, Math.round(total * 4.5 + criticalCount * 7)));
  }, [hasScanned, scanResult]);

  const riskBadge =
    riskScorePct <= 25
      ? { label: hasScanned && riskScorePct === 0 ? 'Clean' : 'Good', bg: 'bg-[#6C5CE7]' }
      : riskScorePct <= 60
        ? { label: 'Moderate', bg: 'bg-[#F59E0B]' }
        : { label: 'Elevated', bg: 'bg-[#EF4444]' };

  // Build interactive area chart data points
  const chartPoints = useMemo(() => {
    if (trendScope === 'session' && sessionHistory.length > 0) {
      return [...sessionHistory]
        .reverse()
        .slice(-7)
        .map((entry, idx) => ({
          label: `Scan ${idx + 1}`,
          value: entry.totalDetections,
          sublabel: entry.sourceName,
        }));
    }

    const sourceStats =
      hasScanned && scanResult && scanResult.categoryStats.length > 0
        ? scanResult.categoryStats
        : presetSummaries.demoCsv.aggregateResult.categoryStats;

    if (trendScope === 'severity') {
      const counts = {
        EMAIL: 0,
        PHONE: 0,
        PAN: 0,
        UPI: 0,
        AADHAAR: 0,
        CARD: 0,
        PERSON: 0,
      };
      const allDets =
        hasScanned && scanResult
          ? scanResult.detections
          : [
              ...presetSummaries.demoText.detections,
              ...presetSummaries.demoCsv.aggregateResult.detections,
              ...presetSummaries.supportLog.detections,
            ];
      for (const d of allDets) {
        if (d.type in counts) {
          counts[d.type as keyof typeof counts] += 1;
        }
      }
      return (Object.entries(counts) as [PIICategory, number][]).map(([cat, val]) => ({
        label: CATEGORY_META[cat].shortLabel,
        value: val,
        sublabel: CATEGORY_META[cat].label,
      }));
    }

    // Default: Top 7 categories across active scan or sample suite
    const orderedCats: PIICategory[] = [
      'EMAIL',
      'PHONE',
      'PERSON',
      'PAN',
      'UPI',
      'ADDRESS',
      'CARD',
    ];
    const map = new Map<PIICategory, number>();
    for (const st of sourceStats) map.set(st.category, st.count);

    return orderedCats.map((cat) => ({
      label: CATEGORY_META[cat].shortLabel,
      value: map.get(cat) ?? 0,
      sublabel: CATEGORY_META[cat].label,
    }));
  }, [trendScope, sessionHistory, hasScanned, scanResult, presetSummaries]);

  // Default highlight peak point on chart
  const peakIndex = useMemo(() => {
    let bestIdx = 0;
    let bestVal = -1;
    chartPoints.forEach((p, idx) => {
      if (p.value > bestVal) {
        bestVal = p.value;
        bestIdx = idx;
      }
    });
    return bestIdx;
  }, [chartPoints]);

  const activePointIndex = hoveredIndex !== null && hoveredIndex < chartPoints.length ? hoveredIndex : peakIndex;

  // SVG chart geometry
  const svgWidth = 640;
  const svgHeight = 200;
  const padLeft = 36;
  const padRight = 24;
  const padTop = 28;
  const padBottom = 18;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const maxVal = Math.max(10, ...chartPoints.map((p) => p.value));
  const niceMax = Math.ceil(maxVal / 5) * 5;

  const coords = chartPoints.map((pt, i) => {
    const x =
      chartPoints.length > 1
        ? padLeft + (i / (chartPoints.length - 1)) * plotW
        : padLeft + plotW / 2;
    const y = padTop + plotH - (pt.value / niceMax) * plotH;
    return { ...pt, x, y };
  });

  const linePath = coords
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ');
  const areaPath =
    coords.length > 0
      ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`
      : '';

  const activeCoord = coords[activePointIndex] ?? coords[0];

  // Semi-circular gauge math (180 degrees from left to right)
  const gaugeRadius = 64;
  const gaugeCircumference = Math.PI * gaugeRadius;
  const gaugeOffset = gaugeCircumference * (1 - riskScorePct / 100);
  const needleAngleRad = Math.PI * (1 - riskScorePct / 100);
  const needleX1 = 90 + Math.cos(needleAngleRad) * (gaugeRadius - 12);
  const needleY1 = 84 - Math.sin(needleAngleRad) * (gaugeRadius - 12);
  const needleX2 = 90 + Math.cos(needleAngleRad) * (gaugeRadius + 6);
  const needleY2 = 84 - Math.sin(needleAngleRad) * (gaugeRadius + 6);

  const lastUpdatedText = useMemo(
    () =>
      new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    [hasScanned, scanResult]
  );

  return (
    <div className="space-y-5">
      {/* Main Reference-Matched Two-Column Frame */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-stretch">
        {/* LEFT MAIN PANEL (8 cols) — Violet Atmospheric Security Overview */}
        <section
          aria-label="VELTRIX security overview"
          className="flex flex-col justify-between rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:col-span-8 dark:border-white/[0.08] dark:veltrix-overview-panel dark:shadow-2xl dark:shadow-black/40"
        >
          {/* Top 2 Metric Cards Row: Active Protections (3D Orbs) + Cyber Risk Score (Gauge) */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Card 1: 3D Floating Violet Orbs Card (matching "Active Devices") */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">
                  {primaryMetricHeading}
                </h2>
                <button
                  type="button"
                  onClick={onOpenWorkspace}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#7C3AED] transition-colors hover:text-[#6D28D9] dark:text-[#A78BFA] dark:hover:text-[#F8FAFC]"
                >
                  <span>Open Sanitizer</span>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>

              <button
                type="button"
                onClick={onOpenWorkspace}
                className="veltrix-orb-stage group relative flex h-[196px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 text-center shadow-lg transition-transform duration-200 hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A78BFA]"
              >
                {/* Floating 3D Violet Spheres matching reference */}
                <span
                  aria-hidden="true"
                  className="veltrix-orb-sphere pointer-events-none absolute -left-8 -top-10 h-28 w-28 opacity-90 transition-transform duration-500 group-hover:translate-x-1"
                />
                <span
                  aria-hidden="true"
                  className="veltrix-orb-sphere pointer-events-none absolute left-[42%] -top-6 h-12 w-12 opacity-75 blur-[0.5px]"
                />
                <span
                  aria-hidden="true"
                  className="veltrix-orb-sphere pointer-events-none absolute -right-4 top-6 h-14 w-14 opacity-85"
                />
                <span
                  aria-hidden="true"
                  className="veltrix-orb-sphere pointer-events-none absolute left-10 bottom-7 h-7 w-7 opacity-80"
                />
                <span
                  aria-hidden="true"
                  className="veltrix-orb-sphere pointer-events-none absolute -bottom-12 right-2 h-32 w-32 opacity-95 transition-transform duration-500 group-hover:-translate-y-1"
                />
                <span
                  aria-hidden="true"
                  className="veltrix-orb-sphere pointer-events-none absolute -bottom-5 right-24 h-14 w-14 opacity-90"
                />

                <div className="relative z-10 space-y-1">
                  <p className="font-mono text-3xl font-bold tracking-tight tabular-nums text-white drop-shadow-sm sm:text-4xl">
                    {primaryMetricValue.toLocaleString()}
                  </p>
                  <p className="text-[11px] font-medium text-violet-200/80">
                    {hasScanned
                      ? 'Sanitized on this device · Click to inspect'
                      : 'Ready locally · Click to launch Sanitizer'}
                  </p>
                </div>
              </button>
            </div>

            {/* Card 2: Semi-Circular Gauge Card (matching "Cyber Risk Score") */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">
                  PII Risk Score
                </h2>
                <span className="font-mono text-[11px] text-emerald-700 dark:text-[#34D399]">
                  100% Local
                </span>
              </div>

              <div className="flex h-[196px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/[0.06] dark:bg-[#191335]/85">
                <div className="relative flex flex-col items-center">
                  <svg
                    viewBox="0 0 180 100"
                    className="h-[104px] w-[180px] overflow-visible"
                    aria-label={`PII Risk Score ${riskScorePct} percent`}
                  >
                    <defs>
                      <linearGradient id="veltrixGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#A78BFA" />
                      </linearGradient>
                    </defs>
                    {/* Background Track Arc */}
                    <path
                      d="M 26 84 A 64 64 0 0 1 154 84"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      strokeLinecap="butt"
                      className="text-slate-200 dark:text-[#2D264B]"
                    />
                    {/* Active Filled Arc */}
                    <path
                      d="M 26 84 A 64 64 0 0 1 154 84"
                      fill="none"
                      stroke="url(#veltrixGaugeGrad)"
                      strokeWidth="12"
                      strokeDasharray={gaugeCircumference}
                      strokeDashoffset={gaugeOffset}
                      className="transition-all duration-500"
                    />
                    {/* Crisp White Gauge Marker Tick */}
                    <line
                      x1={needleX1}
                      y1={needleY1}
                      x2={needleX2}
                      y2={needleY2}
                      stroke="#F8FAFC"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>

                  <span className="-mt-9 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-[#F8FAFC]">
                    {riskScorePct}%
                  </span>
                </div>

                <span
                  className={`mt-2.5 inline-flex items-center rounded-full px-4 py-1 text-xs font-semibold text-white shadow-sm ${riskBadge.bg}`}
                >
                  {riskBadge.label}
                </span>

                <p className="mt-2.5 text-[11px] text-slate-500 dark:text-[#7E789E]">
                  Last Updated: Today {lastUpdatedText} · On-Device
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Chart Section (matching "Risk Trends" area chart) */}
          <div className="mt-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">
                Risk Trends
              </h2>

              <div className="flex items-center gap-3 text-xs">
                {(
                  [
                    { id: 'categories', label: 'Categories' },
                    { id: 'severity', label: 'All Samples' },
                    { id: 'session', label: 'Session' },
                  ] as const
                ).map((item) => {
                  const active = trendScope === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setTrendScope(item.id);
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
              {/* Floating Score Tooltip above active node */}
              {activeCoord && (
                <div
                  className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-center shadow-lg transition-all duration-150 dark:border-white/10 dark:bg-[#1E1A36]"
                  style={{
                    left: `${(activeCoord.x / svgWidth) * 100}%`,
                  }}
                >
                  <p className="text-[10px] font-medium text-slate-500 dark:text-[#94A3B8]">
                    Findings
                  </p>
                  <p className="font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-[#F8FAFC]">
                    {activeCoord.value}
                  </p>
                </div>
              )}

              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
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

                {/* Horizontal Gridlines + Y-axis labels */}
                {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                  const y = padTop + plotH * (1 - frac);
                  const val = Math.round(niceMax * frac);
                  return (
                    <g key={frac}>
                      <line
                        x1={padLeft}
                        y1={y}
                        x2={svgWidth - padRight}
                        y2={y}
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-slate-200 dark:text-white/[0.06]"
                      />
                      <text
                        x={padLeft - 10}
                        y={y + 3}
                        textAnchor="end"
                        className="fill-slate-400 font-mono text-[10px] dark:fill-[#7B7699]"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Area Gradient */}
                {areaPath && <path d={areaPath} fill="url(#veltrixAreaFill)" />}

                {/* Line Stroke */}
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

                {/* Vertical Glowing Indicator at Active Point */}
                {activeCoord && (
                  <g>
                    <line
                      x1={activeCoord.x}
                      y1={activeCoord.y}
                      x2={activeCoord.x}
                      y2={padTop + plotH}
                      stroke="#8B5CF6"
                      strokeWidth="2"
                    />
                    <circle
                      cx={activeCoord.x}
                      cy={activeCoord.y}
                      r="8"
                      fill="#8B5CF6"
                      opacity="0.28"
                    />
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

                {/* Interactive Hit Targets */}
                {coords.map((pt, idx) => (
                  <rect
                    key={pt.label}
                    x={pt.x - 28}
                    y={padTop}
                    width={56}
                    height={plotH + 16}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onClick={() => setHoveredIndex(idx)}
                  />
                ))}
              </svg>

              {/* X-Axis Labels with Violet Active Pill matching reference */}
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

          {/* Crisp Action Launch Strip at Bottom of Overview Panel */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-4 dark:border-white/[0.06]">
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              Clean your data. Protect identities. All scanning runs 100% locally in your browser.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onLoadAndScanPreset('demo-csv')}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-700 transition-colors hover:border-[#8B5CF6]/50 dark:border-white/10 dark:bg-white/[0.05] dark:text-[#F8FAFC] dark:hover:bg-white/[0.09]"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-[#22D3EE]" aria-hidden="true" />
                <span>Scan Sample CSV</span>
              </button>

              <button
                type="button"
                onClick={onOpenSettings}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-700 transition-colors hover:border-[#8B5CF6]/50 dark:border-white/10 dark:bg-white/[0.05] dark:text-[#F8FAFC] dark:hover:bg-white/[0.09]"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#A78BFA]" aria-hidden="true" />
                <span>Redaction Rules</span>
              </button>

              <button
                type="button"
                onClick={onOpenWorkspace}
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] px-4 text-xs font-semibold text-white shadow-md shadow-[#8B5CF6]/25 transition-all hover:brightness-110"
              >
                <ScanSearch className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Launch Sanitizer</span>
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT SIDEBAR PANEL (4 cols) — "Data at risk" matte dark stacked cards */}
        <aside
          aria-label="Data at risk"
          className="flex flex-col rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm lg:col-span-4 dark:border-white/[0.06] dark:bg-[#131318] dark:shadow-2xl dark:shadow-black/40"
        >
          <div className="flex items-center justify-between gap-2 pb-4">
            <div className="flex items-baseline gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">
                Data at risk
              </h2>
              <span className="font-mono text-xs tabular-nums text-slate-400 dark:text-[#7A7E91]">
                {riskCards.length}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setCollapsedRiskList((prev) => !prev)}
              aria-label={collapsedRiskList ? 'Expand datasets list' : 'Collapse datasets list'}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-white/[0.07] dark:text-[#94A3B8] dark:hover:bg-white/[0.12]"
            >
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${collapsedRiskList ? '-rotate-90' : ''}`}
                aria-hidden="true"
              />
            </button>
          </div>

          {!collapsedRiskList && (
            <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
              {riskCards.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500 dark:border-white/10 dark:text-[#94A3B8]">
                  No datasets match &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : (
                riskCards.map((card) => {
                  const badgeBg =
                    card.severity === 'critical'
                      ? 'bg-[#EF4444] text-white'
                      : 'bg-[#F59E0B] text-white';

                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => {
                        if (card.isLiveCurrent) {
                          onOpenWorkspace();
                        } else if (card.presetKey) {
                          onLoadAndScanPreset(card.presetKey);
                        }
                      }}
                      className="group block w-full rounded-2xl border border-slate-200/80 bg-slate-50 p-4 text-left transition-all hover:border-[#8B5CF6]/50 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] dark:border-white/[0.05] dark:bg-[#1E1E24] dark:hover:border-[#8B5CF6]/45 dark:hover:bg-[#24242C]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${badgeBg}`}
                            aria-hidden="true"
                          >
                            <AlertCircle className="h-3.5 w-3.5" />
                          </span>
                          <span className="truncate font-mono text-xs font-semibold text-slate-900 group-hover:text-[#7C3AED] dark:text-[#F8FAFC] dark:group-hover:text-[#A78BFA]">
                            {card.name}
                          </span>
                        </div>
                        <span className="shrink-0 text-[11px] text-slate-400 dark:text-[#7A7E91]">
                          {card.updatedLabel}
                        </span>
                      </div>

                      <div className="mt-3 space-y-1 pl-7 text-xs text-slate-600 dark:text-[#A6AAB8]">
                        <p className="truncate">{card.line1}</p>
                        <p className="truncate">{card.line2}</p>
                      </div>
                    </button>
                  );
                })
              )}

              {/* Quick custom paste / upload card */}
              <button
                type="button"
                onClick={onOpenWorkspace}
                className="flex w-full items-center justify-between rounded-2xl border border-dashed border-slate-300 bg-transparent px-4 py-3.5 text-left text-xs font-medium text-slate-600 transition-colors hover:border-[#8B5CF6]/60 hover:text-[#7C3AED] dark:border-white/12 dark:text-[#94A3B8] dark:hover:border-[#8B5CF6]/60 dark:hover:text-[#A78BFA]"
              >
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  <span>Paste your own text or upload .TXT / .CSV</span>
                </span>
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
