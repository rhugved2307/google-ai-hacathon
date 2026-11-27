export type PIICategory =
  | 'EMAIL'
  | 'PHONE'
  | 'AADHAAR'
  | 'PAN'
  | 'CARD'
  | 'UPI'
  | 'IP_ADDRESS'
  | 'URL'
  | 'DOB'
  | 'PERSON'
  | 'ADDRESS'
  | 'PASSPORT'
  | 'BANK_ACCOUNT'
  | 'PIN_CODE'
  | 'CUSTOM';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type RedactionMode = 'full' | 'partial' | 'custom';

export type AppPage = 'overview' | 'workspace';

export type SourceType = 'text' | 'txt' | 'csv';

export type UploadedFileType = 'txt' | 'csv';

export type PresetKey = 'demo-text' | 'demo-csv' | 'support-log' | 'hr-export';

export type CategoryFilter = PIICategory | 'ALL';

export type ConfidenceFilter = ConfidenceLevel | 'all';

export type LeftViewMode = 'edit' | 'highlight';

export type RightViewMode = 'sanitized' | 'compare';

export type MobileStudioTab = 'original' | 'sanitized';

export type CSVColumnStatus = 'Sanitized' | 'Excluded' | 'Clean';

export interface ValidationCheck {
  readonly valid: boolean;
  readonly confidence: ConfidenceLevel;
}

export type RegexValidationResult =
  | {
      readonly valid: true;
      readonly safeFlags: string;
      readonly error?: undefined;
    }
  | {
      readonly valid: false;
      readonly error: string;
      readonly safeFlags: string;
    };

export type CopyResult =
  | { readonly success: true; readonly error?: undefined }
  | { readonly success: false; readonly error: string };

export type ExportResult =
  | { readonly success: true; readonly filename: string; readonly error?: undefined }
  | { readonly success: false; readonly filename?: undefined; readonly error: string };

export type FileValidationResult =
  | { readonly valid: true; readonly fileType: UploadedFileType; readonly error?: undefined }
  | { readonly valid: false; readonly fileType?: undefined; readonly error: string };

export interface Detection {
  id: string;
  type: PIICategory;
  ruleName: string;
  start: number;
  end: number;
  originalLength: number;
  replacement: string;
  redactionLabel: string;
  confidence: ConfidenceLevel;
  line: number;
  column: number;
  customRuleId?: string;
}

export interface CustomRule {
  id: string;
  name: string;
  pattern: string;
  flags: string;
  replacement: string;
  confidence: ConfidenceLevel;
  enabled: boolean;
}

export interface CategoryMeta {
  id: PIICategory;
  label: string;
  shortLabel: string;
  description: string;
  defaultCustomReplacement: string;
  priority: number;
  colorKey: string;
  accentHex: string;
  highlightLight: string;
  highlightDark: string;
  barClass: string;
  dotClass: string;
  textClass: string;
}

export interface CategoryStat {
  category: PIICategory;
  label: string;
  count: number;
  percentage: number;
}

export interface ScanStats {
  totalDetections: number;
  uniqueCategories: number;
  totalRedactions: number;
  charactersSanitized: number;
  scanDurationMs: number;
}

export interface ScanOptions {
  redactionMode: RedactionMode;
  customReplacements: Record<PIICategory, string>;
  enabledCategories: Record<PIICategory, boolean>;
  customRules: CustomRule[];
  contextHint?: string;
}

export interface ScanResult {
  detections: Detection[];
  sanitizedText: string;
  stats: ScanStats;
  categoryStats: CategoryStat[];
}

export interface ParsedCSV {
  headers: string[];
  rows: string[][];
  delimiter: string;
  lineEnding: '\r\n' | '\n';
  hadTrailingNewline: boolean;
}

export interface CSVColumnSummary {
  index: number;
  name: string;
  detectedCount: number;
  categoryBreakdown: Partial<Record<PIICategory, number>>;
  selected: boolean;
  status: CSVColumnStatus;
}

export interface CSVScanResult {
  parsed: ParsedCSV;
  sanitizedCSV: string;
  columnSummaries: CSVColumnSummary[];
  totalRows: number;
  totalColumns: number;
  columnsWithPII: number;
  aggregateResult: ScanResult;
}

export interface UploadedFileInfo {
  name: string;
  size: number;
  type: UploadedFileType;
  lastModified: number;
}

export interface SessionHistoryEntry {
  id: string;
  timestamp: string;
  sourceName: string;
  sourceType: SourceType;
  redactionMode: RedactionMode;
  totalDetections: number;
  uniqueCategories: number;
  charactersSanitized: number;
  categoryCounts: Partial<Record<PIICategory, number>>;
}
