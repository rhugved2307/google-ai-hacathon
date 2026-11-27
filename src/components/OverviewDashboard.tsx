import { FileSpreadsheet, RotateCcw, ScanSearch, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { scanAndSanitizeCSV } from '../engine/csvSanitizer';
import {
  DEMO_CSV_SAMPLE,
  DEMO_TEXT_SAMPLE,
  HR_EXPORT_PRESET,
  SUPPORT_LOG_PRESET,
} from '../engine/demoData';
import { scanAndSanitizeText } from '../engine/detector';
import {
  CATEGORY_META,
  getDefaultCustomReplacements,
  getDefaultEnabledCategories,
} from '../engine/patterns';
import type {
  CSVScanResult,
  PIICategory,
  PresetKey,
  ScanResult,
  SessionHistoryEntry,
  UploadedFileInfo,
} from '../engine/types';
import { computeRiskScore, formatCategoryCountLabel } from '../utils/formatting';
import { DataAtRiskSidebar, type RiskDatasetCard } from './overview/DataAtRiskSidebar';
import { ProtectedMetricCard } from './overview/ProtectedMetricCard';
import { RiskScoreGaugeCard } from './overview/RiskScoreGaugeCard';
import {
  RiskTrendsChart,
  type ChartDataPoint,
  type TrendScope,
} from './overview/RiskTrendsChart';

export { HR_EXPORT_PRESET, SUPPORT_LOG_PRESET };

export interface OverviewDashboardProps {
  hasScanned: boolean;
  scanResult: ScanResult | null;
  csvResult: CSVScanResult | null;
  uploadedFile: UploadedFileInfo | null;
  sessionHistory: SessionHistoryEntry[];
  searchQuery: string;
  onOpenWorkspace: () => void;
  onLoadAndScanPreset: (preset: PresetKey) => void;
  onOpenSettings: () => void;
  onResetSession: () => void;
}

const DEFAULT_TREND_CATEGORIES: readonly PIICategory[] = [
  'EMAIL',
  'PHONE',
  'PERSON',
  'PAN',
  'UPI',
  'ADDRESS',
  'CARD',
];

const SEVERITY_TREND_CATEGORIES: readonly PIICategory[] = [
  'EMAIL',
  'PHONE',
  'PAN',
  'UPI',
  'AADHAAR',
  'CARD',
  'PERSON',
];

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
  onResetSession,
}: OverviewDashboardProps) {
  const [trendScope, setTrendScope] = useState<TrendScope>('categories');

  // Run lightweight deterministic local scans on fictional sample presets so metrics reflect real engine counts
  const presetSummaries = useMemo(() => {
    const opts = {
      redactionMode: 'full' as const,
      customReplacements: getDefaultCustomReplacements(),
      enabledCategories: getDefaultEnabledCategories(),
      customRules: [],
    };
    return {
      demoText: scanAndSanitizeText(DEMO_TEXT_SAMPLE, opts),
      demoCsv: scanAndSanitizeCSV(DEMO_CSV_SAMPLE, opts),
      supportLog: scanAndSanitizeText(SUPPORT_LOG_PRESET, opts),
      hrExport: scanAndSanitizeText(HR_EXPORT_PRESET, opts),
    };
  }, []);

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
          ? formatCategoryCountLabel(top1.category, top1.count)
          : `Total Findings (${scanResult.stats.totalDetections})`,
        line2: top2
          ? formatCategoryCountLabel(top2.category, top2.count)
          : `Characters sanitized (${scanResult.stats.charactersSanitized})`,
        totalFindings: scanResult.stats.totalDetections,
        isLiveCurrent: true,
      });
    }

    const csvTop = presetSummaries.demoCsv.aggregateResult.categoryStats;
    const countCsvCat = (cat: PIICategory) =>
      csvTop.find((c) => c.category === cat)?.count ?? 4;

    cards.push(
      {
        id: 'preset-demo-csv',
        presetKey: 'demo-csv',
        name: 'customer-files-sample.csv',
        updatedLabel: 'Sample CSV',
        severity: 'critical',
        line1: `Emails (${countCsvCat('EMAIL')}) · Phones (${countCsvCat('PHONE')})`,
        line2: `PAN & UPI identifiers (${countCsvCat('PAN') + countCsvCat('UPI')})`,
        totalFindings: presetSummaries.demoCsv.aggregateResult.stats.totalDetections,
      },
      {
        id: 'preset-demo-text',
        presetKey: 'demo-text',
        name: 'customer-kyc-profile.txt',
        updatedLabel: 'Sample TXT',
        severity: 'critical',
        line1: `Identity IDs (${presetSummaries.demoText.detections.filter((d) => ['AADHAAR', 'PAN', 'PASSPORT'].includes(d.type)).length}) · Financial (${presetSummaries.demoText.detections.filter((d) => ['CARD', 'UPI', 'BANK_ACCOUNT'].includes(d.type)).length})`,
        line2: `Total sensitive fields (${presetSummaries.demoText.stats.totalDetections})`,
        totalFindings: presetSummaries.demoText.stats.totalDetections,
      },
      {
        id: 'preset-support-log',
        presetKey: 'support-log',
        name: 'support-ticket-4821.log',
        updatedLabel: 'Sample Log',
        severity: 'warning',
        line1: `Emails (${presetSummaries.supportLog.detections.filter((d) => d.type === 'EMAIL').length}) · Payment details (${presetSummaries.supportLog.detections.filter((d) => ['CARD', 'UPI'].includes(d.type)).length})`,
        line2: `IP & Contact records (${presetSummaries.supportLog.detections.filter((d) => ['IP_ADDRESS', 'PHONE', 'ADDRESS'].includes(d.type)).length})`,
        totalFindings: presetSummaries.supportLog.stats.totalDetections,
      },
      {
        id: 'preset-hr-export',
        presetKey: 'hr-export',
        name: 'hr-onboarding-record.txt',
        updatedLabel: 'Sample HR',
        severity: 'warning',
        line1: `Government IDs (${presetSummaries.hrExport.detections.filter((d) => ['AADHAAR', 'PAN', 'PASSPORT'].includes(d.type)).length})`,
        line2: `Bank & DOB fields (${presetSummaries.hrExport.detections.filter((d) => ['BANK_ACCOUNT', 'DOB', 'PIN_CODE'].includes(d.type)).length})`,
        totalFindings: presetSummaries.hrExport.stats.totalDetections,
      }
    );

    const q = searchQuery.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.line1.toLowerCase().includes(q) ||
        c.line2.toLowerCase().includes(q)
    );
  }, [hasScanned, scanResult, csvResult, uploadedFile, presetSummaries, searchQuery]);

  const primaryMetricValue =
    hasScanned && scanResult
      ? scanResult.stats.charactersSanitized
      : presetSummaries.demoCsv.aggregateResult.stats.charactersSanitized +
        presetSummaries.demoText.stats.charactersSanitized;

  const primaryMetricHeading = hasScanned ? 'Characters Sanitized' : 'Protected Characters';
  const riskScorePct = useMemo(
    () => computeRiskScore(hasScanned, scanResult),
    [hasScanned, scanResult]
  );

  const chartPoints: ChartDataPoint[] = useMemo(() => {
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

    if (trendScope === 'severity') {
      const counts = new Map<PIICategory, number>();
      for (const cat of SEVERITY_TREND_CATEGORIES) counts.set(cat, 0);

      const allDetections =
        hasScanned && scanResult
          ? scanResult.detections
          : [
              ...presetSummaries.demoText.detections,
              ...presetSummaries.demoCsv.aggregateResult.detections,
              ...presetSummaries.supportLog.detections,
            ];

      for (const det of allDetections) {
        if (counts.has(det.type)) {
          counts.set(det.type, (counts.get(det.type) ?? 0) + 1);
        }
      }

      return SEVERITY_TREND_CATEGORIES.map((cat) => ({
        label: CATEGORY_META[cat].shortLabel,
        value: counts.get(cat) ?? 0,
        sublabel: CATEGORY_META[cat].label,
      }));
    }

    const sourceStats =
      hasScanned && scanResult && scanResult.categoryStats.length > 0
        ? scanResult.categoryStats
        : presetSummaries.demoCsv.aggregateResult.categoryStats;

    const map = new Map<PIICategory, number>();
    for (const st of sourceStats) map.set(st.category, st.count);

    return DEFAULT_TREND_CATEGORIES.map((cat) => ({
      label: CATEGORY_META[cat].shortLabel,
      value: map.get(cat) ?? 0,
      sublabel: CATEGORY_META[cat].label,
    }));
  }, [trendScope, sessionHistory, hasScanned, scanResult, presetSummaries]);

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
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-stretch">
        {/* LEFT MAIN PANEL (8 cols) — Violet Atmospheric Security Overview */}
        <section
          aria-label="VELTRIX security overview"
          className="flex flex-col justify-between rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:col-span-8 dark:border-white/[0.08] dark:veltrix-overview-panel dark:shadow-2xl dark:shadow-black/40"
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <ProtectedMetricCard
              heading={primaryMetricHeading}
              metricValue={primaryMetricValue}
              hasScanned={hasScanned}
              onOpenWorkspace={onOpenWorkspace}
            />
            <RiskScoreGaugeCard
              riskScorePct={riskScorePct}
              hasScanned={hasScanned}
              lastUpdatedText={lastUpdatedText}
              onOpenWorkspace={onOpenWorkspace}
            />
          </div>

          <RiskTrendsChart
            trendScope={trendScope}
            onChangeTrendScope={setTrendScope}
            points={chartPoints}
          />

          {/* Bottom Action Launch Strip */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-4 dark:border-white/[0.06]">
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              Clean your data. Protect identities. All scanning runs 100% locally in your browser.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onResetSession}
                title="Reset workspace, risk score, session history, and demo defaults"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-700 transition-colors hover:border-amber-400/60 hover:text-amber-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-[#E2E8F0] dark:hover:border-amber-400/50 dark:hover:bg-white/[0.09] dark:hover:text-[#FBBF24]"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Reset Session</span>
              </button>

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

        <DataAtRiskSidebar
          cards={riskCards}
          searchQuery={searchQuery}
          onOpenWorkspace={onOpenWorkspace}
          onLoadAndScanPreset={onLoadAndScanPreset}
        />
      </div>
    </div>
  );
}
