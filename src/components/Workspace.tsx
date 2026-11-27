import {
  Check,
  Columns2,
  Copy,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  Highlighter,
  Loader2,
  Pencil,
  RotateCcw,
  ScanSearch,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { scanAndSanitizeText } from '../engine/detector';
import type {
  CustomRule,
  Detection,
  PIICategory,
  RedactionMode,
  ScanResult,
  UploadedFileInfo,
} from '../engine/types';
import { countWords } from '../utils/fileUtils';
import { FileUpload } from './FileUpload';
import { HighlightedText } from './HighlightedText';
import { SanitizedTextView } from './SanitizedTextView';

interface WorkspaceProps {
  rawText: string;
  onChangeText: (text: string) => void;
  uploadedFile: UploadedFileInfo | null;
  isCSVMode: boolean;
  onFileLoaded: (content: string, info: UploadedFileInfo) => void;
  onRemoveFile: () => void;
  onFileError: (msg: string) => void;
  onScan: () => void;
  onClear: () => void;
  onLoadDemoText: () => void;
  onLoadDemoCSV: () => void;
  canUndo: boolean;
  onUndo: () => void;
  liveScan: boolean;
  onToggleLiveScan: () => void;
  isScanning: boolean;
  hasScanned: boolean;
  scanResult: ScanResult | null;
  leftViewMode: 'edit' | 'highlight';
  onChangeLeftViewMode: (mode: 'edit' | 'highlight') => void;
  showHighlights: boolean;
  onToggleHighlights: () => void;
  activeCategoryFilter: PIICategory | 'ALL';
  onClearCategoryFilter: () => void;
  redactionMode: RedactionMode;
  onChangeRedactionMode: (mode: RedactionMode) => void;
  customReplacements: Record<PIICategory, string>;
  enabledCategories: Record<PIICategory, boolean>;
  customRules: CustomRule[];
  onCopyOriginal: () => void;
  onCopySanitized: () => void;
  onDownloadTxt: () => void;
  onDownloadCsv: () => void;
  onDownloadReport: () => void;
  onOpenSettings: () => void;
  mobileTab: 'original' | 'sanitized';
  onChangeMobileTab: (tab: 'original' | 'sanitized') => void;
}

const MODE_OPTIONS: Array<{ id: RedactionMode; label: string }> = [
  { id: 'full', label: 'Full' },
  { id: 'partial', label: 'Partial' },
  { id: 'custom', label: 'Custom' },
];

export function Workspace({
  rawText,
  onChangeText,
  uploadedFile,
  isCSVMode,
  onFileLoaded,
  onRemoveFile,
  onFileError,
  onScan,
  onClear,
  onLoadDemoText,
  onLoadDemoCSV,
  canUndo,
  onUndo,
  liveScan,
  onToggleLiveScan,
  isScanning,
  hasScanned,
  scanResult,
  leftViewMode,
  onChangeLeftViewMode,
  showHighlights,
  onToggleHighlights,
  activeCategoryFilter,
  onClearCategoryFilter,
  redactionMode,
  onChangeRedactionMode,
  customReplacements,
  enabledCategories,
  customRules,
  onCopyOriginal,
  onCopySanitized,
  onDownloadTxt,
  onDownloadCsv,
  onDownloadReport,
  onOpenSettings,
  mobileTab,
  onChangeMobileTab,
}: WorkspaceProps) {
  const [rightViewMode, setRightViewMode] = useState<'sanitized' | 'compare'>('sanitized');
  const [copiedSanitized, setCopiedSanitized] = useState(false);

  const charCount = rawText.length;
  const wordCount = useMemo(() => countWords(rawText), [rawText]);
  const sanitizedText = scanResult?.sanitizedText ?? '';

  // Compute exact text-offset spans when rendering HighlightedText for CSV content
  const highlightDetections: Detection[] = useMemo(() => {
    if (!hasScanned || leftViewMode !== 'highlight') return [];
    if (!isCSVMode) return scanResult?.detections ?? [];
    return scanAndSanitizeText(rawText, {
      redactionMode,
      customReplacements,
      enabledCategories,
      customRules,
    }).detections;
  }, [
    hasScanned,
    leftViewMode,
    isCSVMode,
    scanResult,
    rawText,
    redactionMode,
    customReplacements,
    enabledCategories,
    customRules,
  ]);

  const diffRows = useMemo(() => {
    if (!hasScanned || rightViewMode !== 'compare') return [];
    const beforeLines = rawText.split(/\r?\n/);
    const afterLines = sanitizedText.split(/\r?\n/);
    const maxLen = Math.max(beforeLines.length, afterLines.length);
    const rows: Array<{ lineNum: number; before: string; after: string; changed: boolean }> = [];
    for (let i = 0; i < maxLen; i++) {
      const b = beforeLines[i] ?? '';
      const a = afterLines[i] ?? '';
      rows.push({ lineNum: i + 1, before: b, after: a, changed: b !== a });
    }
    return rows;
  }, [hasScanned, rightViewMode, rawText, sanitizedText]);

  const handleCopySanitized = () => {
    onCopySanitized();
    setCopiedSanitized(true);
    window.setTimeout(() => setCopiedSanitized(false), 1600);
  };

  return (
    <section aria-label="Sanitization workspace" className="space-y-4">
      {/* Top Input Control & File Upload Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-[#283449] dark:bg-[#141B2D] dark:shadow-none">
        <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-12 xl:items-center">
          {/* Drag-and-drop File Upload */}
          <div className="xl:col-span-5">
            <FileUpload
              uploadedFile={uploadedFile}
              onFileLoaded={onFileLoaded}
              onRemoveFile={onRemoveFile}
              onError={onFileError}
            />
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 xl:col-span-7 xl:justify-end">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onLoadDemoText}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 transition-colors hover:border-[#8B5CF6]/50 hover:text-[#7C3AED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] whitespace-nowrap dark:border-[#283449] dark:bg-[#1B2540] dark:text-[#F8FAFC] dark:hover:border-[#8B5CF6]/60 dark:hover:text-[#A78BFA]"
              >
                <Database className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Load Sample</span>
              </button>

              <button
                type="button"
                onClick={onLoadDemoCSV}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 transition-colors hover:border-[#22D3EE]/60 hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] whitespace-nowrap dark:border-[#283449] dark:bg-[#1B2540] dark:text-[#F8FAFC] dark:hover:border-[#22D3EE]/50 dark:hover:text-[#22D3EE]"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sample CSV</span>
              </button>

              <button
                type="button"
                onClick={onToggleLiveScan}
                aria-pressed={liveScan}
                className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] whitespace-nowrap ${
                  liveScan
                    ? 'border-[#22D3EE]/50 bg-[#22D3EE]/12 text-cyan-800 dark:border-[#22D3EE]/45 dark:bg-[#22D3EE]/14 dark:text-[#22D3EE]'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 dark:border-[#283449] dark:bg-[#1B2540] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]'
                }`}
              >
                <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Live: {liveScan ? 'On' : 'Off'}</span>
              </button>

              {canUndo && (
                <button
                  type="button"
                  onClick={onUndo}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 whitespace-nowrap dark:border-[#283449] dark:bg-[#1B2540] dark:text-[#F8FAFC]"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Undo</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClear}
                disabled={!rawText && !uploadedFile && !hasScanned}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-600 transition-colors hover:border-red-400/50 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap dark:border-[#283449] dark:bg-[#1B2540] dark:text-[#94A3B8] dark:hover:border-[#F87171]/40 dark:hover:bg-[#F87171]/10 dark:hover:text-[#F87171]"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Clear</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onScan}
              disabled={!rawText.trim() || isScanning}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] px-4 text-xs font-semibold text-white shadow-sm shadow-[#8B5CF6]/25 transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap dark:focus-visible:ring-offset-[#141B2D]"
            >
              {isScanning ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <ScanSearch className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>
                {isScanning
                  ? 'Scanning...'
                  : hasScanned
                    ? 'Rescan & Sanitize'
                    : 'Scan & Sanitize'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Original / Sanitized Segmented Tabs */}
      <div
        role="tablist"
        aria-label="Mobile workspace panels"
        className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 lg:hidden dark:border-[#283449] dark:bg-[#141B2D]"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'original'}
          onClick={() => onChangeMobileTab('original')}
          className={`rounded-lg py-2 text-xs font-semibold transition-colors ${
            mobileTab === 'original'
              ? 'bg-white text-slate-900 shadow-xs dark:bg-[#1B2540] dark:text-[#F8FAFC]'
              : 'text-slate-600 dark:text-[#94A3B8]'
          }`}
        >
          Original Input
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'sanitized'}
          onClick={() => onChangeMobileTab('sanitized')}
          className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors ${
            mobileTab === 'sanitized'
              ? 'bg-white text-slate-900 shadow-xs dark:bg-[#1B2540] dark:text-[#F8FAFC]'
              : 'text-slate-600 dark:text-[#94A3B8]'
          }`}
        >
          <span>Sanitized Output</span>
          {hasScanned && scanResult && scanResult.stats.totalRedactions > 0 && (
            <span className="font-mono text-[11px] text-emerald-700 dark:text-[#34D399]">
              ({scanResult.stats.totalRedactions})
            </span>
          )}
        </button>
      </div>

      {/* Split-Screen Workspace: LEFT Original/Highlights | RIGHT Sanitized Output */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* LEFT PANEL — ORIGINAL + CATEGORY HIGHLIGHTS */}
        <div
          className={`flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-[#283449] dark:bg-[#141B2D] dark:shadow-none ${
            mobileTab === 'original' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Left Panel Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-[#283449]">
            <div className="flex items-center gap-2.5 min-w-0">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">
                Original Input
              </h2>
              <span className="text-slate-300 dark:text-[#283449]" aria-hidden="true">
                ·
              </span>
              <span className="truncate text-xs text-slate-500 dark:text-[#94A3B8]">
                {isCSVMode ? 'CSV File' : uploadedFile ? 'TXT File' : 'Raw Text'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-[#283449] dark:bg-[#0B1020]">
                <button
                  type="button"
                  onClick={() => onChangeLeftViewMode('edit')}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                    leftViewMode === 'edit'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-[#1B2540] dark:text-[#F8FAFC]'
                      : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]'
                  }`}
                >
                  <Pencil className="h-3 w-3" aria-hidden="true" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  disabled={!hasScanned}
                  onClick={() => onChangeLeftViewMode('highlight')}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-45 ${
                    leftViewMode === 'highlight'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-[#1B2540] dark:text-[#F8FAFC]'
                      : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]'
                  }`}
                >
                  <Highlighter className="h-3 w-3" aria-hidden="true" />
                  <span>Highlights</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onCopyOriginal}
                disabled={!rawText}
                title="Copy original text"
                aria-label="Copy original text"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-[#8B5CF6]/50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#283449] dark:bg-[#1B2540] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]"
              >
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Active Category Filter Strip */}
          {activeCategoryFilter !== 'ALL' && hasScanned && (
            <div className="flex items-center justify-between border-b border-slate-200/80 bg-[#8B5CF6]/8 px-4 py-1.5 text-xs dark:border-[#283449] dark:bg-[#8B5CF6]/12">
              <span className="text-slate-700 dark:text-[#F8FAFC]">
                Filtering highlights by{' '}
                <strong className="font-mono text-[#7C3AED] dark:text-[#A78BFA]">
                  {activeCategoryFilter}
                </strong>
              </span>
              <button
                type="button"
                onClick={onClearCategoryFilter}
                className="font-semibold text-[#7C3AED] hover:underline dark:text-[#A78BFA]"
              >
                Show all
              </button>
            </div>
          )}

          {/* Left Editor / Highlight Surface */}
          <div className="relative h-[380px] sm:h-[420px] bg-white dark:bg-[#0F1629]">
            {leftViewMode === 'highlight' && hasScanned ? (
              <HighlightedText
                text={rawText}
                detections={highlightDetections}
                showHighlights={showHighlights}
                onToggleHighlights={onToggleHighlights}
                activeCategoryFilter={activeCategoryFilter}
              />
            ) : (
              <textarea
                value={rawText}
                onChange={(e) => onChangeText(e.target.value)}
                spellCheck={false}
                aria-label="Original input text"
                placeholder="Paste raw text, customer support logs, records, or CSV data here — or click Load Sample above. Everything is processed strictly inside your browser."
                className="h-full w-full resize-none bg-transparent p-4 font-mono text-[13px] leading-6 text-slate-800 placeholder:font-sans placeholder:text-slate-400 focus:outline-none dark:text-[#F8FAFC] dark:placeholder:text-[#64748B]"
              />
            )}
          </div>

          {/* Left Footer Metadata */}
          <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/70 px-4 py-2.5 text-xs text-slate-500 dark:border-[#283449] dark:bg-[#11182A] dark:text-[#94A3B8]">
            <div className="flex items-center gap-2.5 font-mono tabular-nums">
              <span>{charCount.toLocaleString()} chars</span>
              <span aria-hidden="true">·</span>
              <span>{wordCount.toLocaleString()} words</span>
            </div>
            <span className="hidden sm:inline text-[11px]">
              Shortcut: <kbd className="font-mono text-slate-700 dark:text-[#F8FAFC]">⌘/Ctrl+Enter</kbd>
            </span>
          </div>
        </div>

        {/* RIGHT PANEL — SANITIZED OUTPUT WITH EMERALD LABELS */}
        <div
          className={`flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-[#283449] dark:bg-[#141B2D] dark:shadow-none ${
            mobileTab === 'sanitized' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Right Panel Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-[#283449]">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">
                Sanitized Output
              </h2>
              {hasScanned && scanResult && (
                <>
                  <span className="text-slate-300 dark:text-[#283449]" aria-hidden="true">
                    ·
                  </span>
                  <span className="font-mono text-xs font-semibold tabular-nums text-emerald-700 dark:text-[#34D399]">
                    {scanResult.stats.totalRedactions} redacted
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Compact Redaction Mode Selector */}
              <div
                role="radiogroup"
                aria-label="Redaction mode"
                className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-[#283449] dark:bg-[#0B1020]"
              >
                {MODE_OPTIONS.map((m) => {
                  const active = redactionMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => onChangeRedactionMode(m.id)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                        active
                          ? 'bg-[#8B5CF6] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]'
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>

              {/* Clean / Diff toggle */}
              <button
                type="button"
                disabled={!hasScanned}
                onClick={() =>
                  setRightViewMode((prev) => (prev === 'sanitized' ? 'compare' : 'sanitized'))
                }
                title="Toggle Before / After comparison"
                className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap ${
                  rightViewMode === 'compare'
                    ? 'border-[#22D3EE]/50 bg-[#22D3EE]/12 text-cyan-800 dark:border-[#22D3EE]/45 dark:bg-[#22D3EE]/15 dark:text-[#22D3EE]'
                    : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 dark:border-[#283449] dark:bg-[#1B2540] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]'
                }`}
              >
                <Columns2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Diff</span>
              </button>
            </div>
          </div>

          {/* Scanning Progress Bar */}
          {isScanning && (
            <div className="h-0.5 w-full overflow-hidden bg-slate-200 dark:bg-[#283449]">
              <div className="h-full w-2/3 animate-pulse bg-gradient-to-r from-[#8B5CF6] via-[#22D3EE] to-[#34D399]" />
            </div>
          )}

          {/* Right Output Surface */}
          <div className="relative h-[380px] sm:h-[420px] overflow-auto bg-white dark:bg-[#0F1629]">
            {isScanning ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-[#8B5CF6] dark:text-[#A78BFA]" />
                <p className="text-xs font-medium text-slate-600 dark:text-[#94A3B8]">
                  Scanning and sanitizing locally in your browser...
                </p>
              </div>
            ) : !hasScanned ? (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-[#8B5CF6] dark:border-[#283449] dark:bg-[#1B2540] dark:text-[#A78BFA]">
                  <ShieldCheck className="h-6 w-6" aria-hidden="true" />
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">
                  Sanitized output appears here
                </p>
                <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500 dark:text-[#94A3B8]">
                  Paste text or upload a file, then click{' '}
                  <strong className="text-slate-800 dark:text-[#F8FAFC]">Scan &amp; Sanitize</strong>{' '}
                  to view emerald-tagged redactions.
                </p>
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-[#8B5CF6]/50 dark:border-[#283449] dark:bg-[#1B2540] dark:text-[#F8FAFC]"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 text-[#8B5CF6] dark:text-[#A78BFA]" />
                  <span>Configure Redaction Rules</span>
                </button>
              </div>
            ) : rightViewMode === 'compare' ? (
              <div className="divide-y divide-slate-200/70 font-mono text-xs dark:divide-[#283449]/70">
                {diffRows.map((row) => (
                  <div
                    key={row.lineNum}
                    className={`grid grid-cols-1 gap-1 px-4 py-2 sm:grid-cols-2 sm:gap-3 ${
                      row.changed ? 'bg-[#8B5CF6]/6 dark:bg-[#8B5CF6]/10' : ''
                    }`}
                  >
                    <div className="min-w-0 break-words text-slate-500 dark:text-[#94A3B8]">
                      <span className="mr-2 select-none text-[10px] tabular-nums opacity-60">
                        {row.lineNum}
                      </span>
                      <span className={row.changed ? 'line-through decoration-red-400/70' : ''}>
                        {row.before || ' '}
                      </span>
                    </div>
                    <div className="min-w-0 break-words text-slate-900 dark:text-[#F8FAFC]">
                      <span className={row.changed ? 'text-emerald-700 dark:text-[#34D399]' : ''}>
                        {row.after || ' '}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <SanitizedTextView
                rawText={rawText}
                sanitizedText={sanitizedText}
                detections={scanResult?.detections ?? []}
                isCSVMode={isCSVMode}
                activeCategoryFilter={activeCategoryFilter}
              />
            )}
          </div>

          {/* Right Footer: Copy & Download Suite */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/70 px-4 py-2.5 dark:border-[#283449] dark:bg-[#11182A]">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopySanitized}
                disabled={!hasScanned || !sanitizedText}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 transition-colors hover:border-[#8B5CF6]/50 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap dark:border-[#283449] dark:bg-[#1B2540] dark:text-[#F8FAFC] dark:hover:border-[#8B5CF6]/60"
              >
                {copiedSanitized ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-[#34D399]" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onDownloadTxt}
                disabled={!hasScanned || !sanitizedText}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:border-[#8B5CF6]/50 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap dark:border-[#283449] dark:bg-[#1B2540] dark:text-[#F8FAFC]"
              >
                <FileText className="h-3.5 w-3.5 text-[#8B5CF6] dark:text-[#A78BFA]" />
                <span>TXT</span>
              </button>

              {isCSVMode && (
                <button
                  type="button"
                  onClick={onDownloadCsv}
                  disabled={!hasScanned || !sanitizedText}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#22D3EE] px-3 text-xs font-semibold text-slate-950 transition-colors hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>CSV</span>
                </button>
              )}

              <button
                type="button"
                onClick={onDownloadReport}
                disabled={!hasScanned || !scanResult}
                title="Download PII-free summary report"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 transition-colors hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap dark:border-[#283449] dark:bg-[#1B2540] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Report</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenSettings}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#7C3AED] hover:underline whitespace-nowrap dark:text-[#A78BFA]"
            >
              <SlidersHorizontal className="h-3 w-3" />
              <span>Customize</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
