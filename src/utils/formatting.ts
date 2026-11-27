import { CATEGORY_LIST, CATEGORY_META } from '../engine/patterns';
import type {
  CSVColumnStatus,
  ConfidenceFilter,
  ConfidenceLevel,
  PIICategory,
  RedactionMode,
  ScanResult,
  UploadedFileInfo,
} from '../engine/types';

export const REDACTION_MODE_OPTIONS: ReadonlyArray<{
  readonly id: RedactionMode;
  readonly label: string;
}> = [
  { id: 'full', label: 'Full' },
  { id: 'partial', label: 'Partial' },
  { id: 'custom', label: 'Custom' },
];

export const CRITICAL_PII_CATEGORIES: ReadonlySet<PIICategory> = new Set<PIICategory>([
  'AADHAAR',
  'PAN',
  'CARD',
  'BANK_ACCOUNT',
  'PASSPORT',
]);

export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return singular;
  return plural ?? `${singular}s`;
}

export function pluralizeCategoryLabel(label: string, count: number): string {
  if (count === 1) return label;
  if (label === 'Date of Birth') return 'Dates of Birth';
  if (label === 'URL / Web Link') return 'URLs / Web Links';
  if (/(?:s|x|z|ch|sh)$/i.test(label)) return `${label}es`;
  return `${label}s`;
}

export function formatCategoryCountLabel(category: PIICategory, count: number): string {
  return `${pluralizeCategoryLabel(CATEGORY_META[category].label, count)} (${count})`;
}

export function getOutputFilename(
  uploadedFile: UploadedFileInfo | null,
  isCSVMode: boolean
): string {
  if (uploadedFile) {
    return `sanitized-${uploadedFile.name}`;
  }
  return isCSVMode ? 'sanitized-custom-input.csv' : 'sanitized-custom-input.txt';
}

export function computeRiskScore(hasScanned: boolean, scanResult: ScanResult | null): number {
  if (!hasScanned || !scanResult) return 21; // Baseline readiness index
  const total = scanResult.stats.totalDetections;
  if (total === 0) return 0;
  const criticalCount = scanResult.detections.filter((d) =>
    CRITICAL_PII_CATEGORIES.has(d.type)
  ).length;
  return Math.min(98, Math.max(12, Math.round(total * 4.5 + criticalCount * 7)));
}

export interface RiskBadgeStyle {
  readonly label: string;
  readonly bg: string;
}

export function getRiskBadge(riskScorePct: number, hasScanned: boolean): RiskBadgeStyle {
  if (riskScorePct <= 25) {
    return {
      label: hasScanned && riskScorePct === 0 ? 'Clean' : 'Good',
      bg: 'bg-[#6C5CE7]',
    };
  }
  if (riskScorePct <= 60) {
    return { label: 'Moderate', bg: 'bg-[#F59E0B]' };
  }
  return { label: 'Elevated', bg: 'bg-[#EF4444]' };
}

export function getConfidenceTextClass(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case 'high':
      return 'text-emerald-700 dark:text-[#34D399]';
    case 'medium':
      return 'text-amber-700 dark:text-[#F59E0B]';
    case 'low':
    default:
      return 'text-slate-500 dark:text-[#94A3B8]';
  }
}

export function getColumnStatusClass(status: CSVColumnStatus): string {
  switch (status) {
    case 'Sanitized':
      return 'text-emerald-700 dark:text-[#34D399]';
    case 'Excluded':
      return 'text-amber-700 dark:text-[#F59E0B]';
    case 'Clean':
    default:
      return 'text-slate-500 dark:text-[#94A3B8]';
  }
}

export function getTypedCategoryEntries(
  counts: Partial<Record<PIICategory, number>>
): Array<[PIICategory, number]> {
  const entries: Array<[PIICategory, number]> = [];
  for (const cat of CATEGORY_LIST) {
    const count = counts[cat];
    if (typeof count === 'number' && count > 0) {
      entries.push([cat, count]);
    }
  }
  return entries;
}

export function isConfidenceLevel(value: string): value is ConfidenceLevel {
  return value === 'high' || value === 'medium' || value === 'low';
}

export function isConfidenceFilter(value: string): value is ConfidenceFilter {
  return value === 'all' || isConfidenceLevel(value);
}
