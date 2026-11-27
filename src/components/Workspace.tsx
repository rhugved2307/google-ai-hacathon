import {
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  Columns2,
  Compass,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  FolderUp,
  Highlighter,
  Loader2,
  Lock,
  Maximize2,
  Minimize2,
  Minus,
  PanelRight,
  Pencil,
  RotateCcw,
  ScanSearch,
  ShieldCheck,
  SlidersHorizontal,
  Table2,
  Trash2,
  Upload,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { scanAndSanitizeText } from '../engine/detector';
import type {
  CustomRule,
  Detection,
  PIICategory,
  RedactionMode,
  ScanResult,
  UploadedFileInfo,
} from '../engine/types';
import { countWords, formatBytes, readLocalFile } from '../utils/fileUtils';
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
  onOpenHelp: () => void;
  onBackToOverview: () => void;
  mobileTab: 'original' | 'sanitized';
  onChangeMobileTab: (tab: 'original' | 'sanitized') => void;
}

const MODE_OPTIONS: Array<{ id: RedactionMode; label: string }> = [
  { id: 'full', label: 'Full' },
  { id: 'partial', label: 'Partial' },
  { id: 'custom', label: 'Custom' },
];

const FONT_FAMILIES = [
  { id: 'serif', label: 'Serif', className: 'font-serif' },
  { id: 'mono', label: 'Mono', className: 'font-mono' },
  { id: 'sans', label: 'Sans', className: 'font-sans' },
] as const;

const FONT_SIZES = [14, 15, 16, 18] as const;

const HEX_MATRIX_ROWS = [
  '56D45C3B C34B 089018F0 8F078F6 9A1891290',
  '089018F0 8F078F6 7F 4CD4C 56D45C3B 23A12',
  '4B 67E56 6 5 D5 DE5DE5CD 4CD4C 8F078F018',
  '23A129 29A1 9A129A29 4BC45 67E67E 9018F0',
  '78F67E 6 E 56D45C3B 8F078F 34B29A1 4CD4C',
  'C34B 9A129A29 4CD4C 8F078F0 67E67E 29A19',
  'DE5DE5CD 34B 3 23A129 4BC45 9018F0 8F078',
  '78F67E078 EF6D C34B3 67E67E 089018 4CD4C',
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
  onOpenHelp,
  onBackToOverview,
  mobileTab,
  onChangeMobileTab,
}: WorkspaceProps) {
  const [rightViewMode, setRightViewMode] = useState<'sanitized' | 'compare'>('sanitized');
  const [copiedSanitized, setCopiedSanitized] = useState(false);
  const [railExpanded, setRailExpanded] = useState(false);
  const [fontIdx, setFontIdx] = useState(0);
  const [fontSizeIdx, setFontSizeIdx] = useState(2); // 16px default
  const [viewerZoom, setViewerZoom] = useState(100);
  const [viewerExpanded, setViewerExpanded] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(true);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isReadingFile, setIsReadingFile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeFont = FONT_FAMILIES[fontIdx];
  const activeFontSize = FONT_SIZES[fontSizeIdx];
  const viewerFontSize = Math.round((13 * viewerZoom) / 100);

  const charCount = rawText.length;
  const wordCount = useMemo(() => countWords(rawText), [rawText]);
  const sanitizedText = scanResult?.sanitizedText ?? '';

  const enabledDetectorCount = useMemo(
    () => Object.values(enabledCategories).filter(Boolean).length,
    [enabledCategories]
  );

  const outputFileName = uploadedFile
    ? `sanitized-${uploadedFile.name}`
    : isCSVMode
      ? 'sanitized-custom-input.csv'
      : 'sanitized-custom-input.txt';

  const documentHeading = uploadedFile
    ? uploadedFile.name.replace(/\.[^/.]+$/, '').toUpperCase()
    : 'YOUR PRIVACY MATTERS';

  const handleLocalFile = async (file: File | undefined) => {
    if (!file) return;
    setIsReadingFile(true);
    try {
      const { content, info } = await readLocalFile(file);
      onFileLoaded(content, info);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to read the selected file.';
      onFileError(msg);
    } finally {
      setIsReadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCanvasDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    void handleLocalFile(file);
  };

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

  const scrollToElement = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section aria-label="VELTRIX Privacy Document Studio" className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.csv,text/plain,text/csv"
        onChange={(e) => void handleLocalFile(e.target.files?.[0])}
        className="sr-only"
        aria-label="Upload local TXT or CSV file"
      />

      {/* Mobile Original / Sanitized Segmented Tabs */}
      <div
        role="tablist"
        aria-label="Mobile studio panels"
        className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 lg:hidden dark:border-white/[0.06] dark:bg-[#131318]"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'original'}
          onClick={() => onChangeMobileTab('original')}
          className={`rounded-lg py-2 text-xs font-semibold transition-colors ${
            mobileTab === 'original'
              ? 'bg-white text-slate-900 shadow-xs dark:bg-[#1E1A36] dark:text-[#F8FAFC]'
              : 'text-slate-600 dark:text-[#94A3B8]'
          }`}
        >
          Original Document
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'sanitized'}
          onClick={() => onChangeMobileTab('sanitized')}
          className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors ${
            mobileTab === 'sanitized'
              ? 'bg-white text-slate-900 shadow-xs dark:bg-[#1E1A36] dark:text-[#F8FAFC]'
              : 'text-slate-600 dark:text-[#94A3B8]'
          }`}
        >
          <span>Sanitized Viewer</span>
          {hasScanned && scanResult && scanResult.stats.totalRedactions > 0 && (
            <span className="font-mono text-[11px] text-emerald-700 dark:text-[#34D399]">
              ({scanResult.stats.totalRedactions})
            </span>
          )}
        </button>
      </div>

      {/* Main Document Studio Frame using Page 1's deep obsidian + violet atmospheric palette */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!isDraggingFile) setIsDraggingFile(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
          setIsDraggingFile(false);
        }}
        onDrop={handleCanvasDrop}
        className="relative flex min-h-[600px] overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-white/[0.08] dark:veltrix-overview-panel dark:shadow-2xl dark:shadow-black/50"
      >
        {/* Drag-and-Drop Overlay across the entire studio */}
        {isDraggingFile && (
          <div className="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-[#09090D]/80 backdrop-blur-xs">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#A78BFA]/50 bg-[#171232]/90 text-[#A78BFA] shadow-xl">
              <Upload className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="text-sm font-semibold text-white">
              Drop .TXT or .CSV file to load locally in browser memory
            </p>
            <p className="text-xs text-violet-200/80">Zero external uploads · Processed on-device</p>
          </div>
        )}

        {/* LEFT SLIM STUDIO ICON RAIL */}
        <aside
          aria-label="Studio navigation rail"
          className={`hidden md:flex shrink-0 flex-col justify-between border-r border-slate-200 bg-slate-50/90 py-3 transition-all duration-200 dark:border-white/[0.06] dark:bg-[#131318] ${
            railExpanded ? 'w-48 px-2.5' : 'w-14 items-center px-1.5'
          }`}
        >
          <div className={`flex flex-col gap-1.5 ${railExpanded ? 'w-full' : 'items-center'}`}>
            {/* Circular Brand Return Button */}
            <button
              type="button"
              onClick={onBackToOverview}
              title="Back to Security Overview"
              className={`mb-2 flex h-9 items-center gap-2.5 rounded-full text-slate-700 transition-colors hover:bg-slate-200/80 dark:text-[#F8FAFC] dark:hover:bg-white/[0.07] ${
                railExpanded ? 'w-full px-2' : 'w-9 justify-center'
              }`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[#A78BFA] dark:bg-[#1E1E24] dark:text-[#A78BFA] dark:ring-1 dark:ring-white/10">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              </span>
              {railExpanded && (
                <span className="truncate text-xs font-semibold tracking-tight">Overview</span>
              )}
            </button>

            {/* Rail Actions */}
            {[
              {
                label: 'Overview',
                icon: Compass,
                onClick: onBackToOverview,
                active: false,
              },
              {
                label: 'Upload File',
                icon: FolderUp,
                onClick: () => fileInputRef.current?.click(),
                active: Boolean(uploadedFile),
              },
              {
                label: 'Sample TXT',
                icon: FileText,
                onClick: onLoadDemoText,
                active: false,
              },
              {
                label: 'Sample CSV',
                icon: FileSpreadsheet,
                onClick: onLoadDemoCSV,
                active: isCSVMode,
              },
              {
                label: 'Redaction Rules',
                icon: SlidersHorizontal,
                onClick: onOpenSettings,
                active: false,
              },
              {
                label: 'Local Privacy',
                icon: Lock,
                onClick: onOpenHelp,
                active: false,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  title={item.label}
                  aria-label={item.label}
                  className={`flex h-9 items-center gap-2.5 rounded-xl text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] ${
                    railExpanded ? 'w-full px-2.5' : 'w-9 justify-center'
                  } ${
                    item.active
                      ? 'bg-[#8B5CF6]/15 text-[#7C3AED] dark:bg-[#8B5CF6]/20 dark:text-[#F8FAFC]'
                      : 'text-slate-500 hover:bg-slate-200/70 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:bg-white/[0.06] dark:hover:text-[#F8FAFC]'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {railExpanded && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>

          {/* Bottom Collapse / Expand Chevron */}
          <button
            type="button"
            onClick={() => setRailExpanded((prev) => !prev)}
            title={railExpanded ? 'Collapse rail' : 'Expand rail'}
            aria-label={railExpanded ? 'Collapse left rail' : 'Expand left rail'}
            className={`flex h-8 items-center gap-2 rounded-lg text-xs text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-slate-800 dark:text-[#7A7E91] dark:hover:bg-white/[0.06] dark:hover:text-[#F8FAFC] ${
              railExpanded ? 'w-full px-2.5' : 'w-8 justify-center'
            }`}
          >
            {railExpanded ? (
              <>
                <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Collapse</span>
              </>
            ) : (
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </aside>

        {/* CENTER + FLOATING PREVIEW STUDIO COLUMN */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* TOP STUDIO DOCUMENT TOOLBAR */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/[0.06] dark:bg-[#131318]/90">
            {/* Left Formatting & View Controls */}
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Font Family Selector (Aa) */}
              <button
                type="button"
                onClick={() => setFontIdx((prev) => (prev + 1) % FONT_FAMILIES.length)}
                title={`Typography: ${activeFont.label} (click to cycle)`}
                className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200/70 dark:text-[#E2E8F0] dark:hover:bg-white/[0.07]"
              >
                <span className={activeFont.className}>Aa</span>
                <span className="text-[10px] text-slate-400 dark:text-[#8E89AC]">
                  {activeFont.label}
                </span>
              </button>

              {/* Font Size Stepper (16) */}
              <button
                type="button"
                onClick={() => setFontSizeIdx((prev) => (prev + 1) % FONT_SIZES.length)}
                title={`Document font size: ${activeFontSize}px (click to cycle)`}
                className="inline-flex h-8 items-center gap-1 rounded-lg px-2 font-mono text-xs tabular-nums text-slate-700 transition-colors hover:bg-slate-200/70 dark:text-[#E2E8F0] dark:hover:bg-white/[0.07]"
              >
                <span>{activeFontSize}</span>
                <span className="text-[10px] text-slate-400 dark:text-[#8E89AC]">px</span>
              </button>

              <span className="mx-0.5 h-4 w-px bg-slate-200 dark:bg-white/[0.08]" aria-hidden="true" />

              {/* Edit / Highlights Switch */}
              <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 dark:border-white/[0.08] dark:bg-[#191335]/70">
                <button
                  type="button"
                  onClick={() => onChangeLeftViewMode('edit')}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap ${
                    leftViewMode === 'edit'
                      ? 'bg-[#7C5CFC] text-white shadow-xs'
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
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-40 ${
                    leftViewMode === 'highlight'
                      ? 'bg-[#7C5CFC] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]'
                  }`}
                >
                  <Highlighter className="h-3 w-3" aria-hidden="true" />
                  <span>Highlights</span>
                </button>
              </div>

              <span className="mx-0.5 hidden h-4 w-px bg-slate-200 sm:inline-block dark:bg-white/[0.08]" aria-hidden="true" />

              {/* Redaction Mode Switcher */}
              <div
                role="radiogroup"
                aria-label="Redaction mode"
                className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 dark:border-white/[0.08] dark:bg-[#191335]/70"
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
                      className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap ${
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

              {/* Compact Icon Utilities */}
              <button
                type="button"
                onClick={onToggleLiveScan}
                aria-pressed={liveScan}
                title="Toggle live debounced local scan"
                className={`inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-medium transition-colors whitespace-nowrap ${
                  liveScan
                    ? 'bg-[#8B5CF6]/18 text-[#7C3AED] dark:bg-[#8B5CF6]/22 dark:text-[#C4B5FD]'
                    : 'text-slate-500 hover:bg-slate-200/70 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:bg-white/[0.06] dark:hover:text-[#F8FAFC]'
                }`}
              >
                <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Live</span>
              </button>

              {canUndo && (
                <button
                  type="button"
                  onClick={onUndo}
                  title="Undo last change"
                  aria-label="Undo last change"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:bg-white/[0.06] dark:hover:text-[#F8FAFC]"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}

              <button
                type="button"
                onClick={onCopyOriginal}
                disabled={!rawText}
                title="Copy original text"
                aria-label="Copy original text"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900 disabled:opacity-35 dark:text-[#94A3B8] dark:hover:bg-white/[0.06] dark:hover:text-[#F8FAFC]"
              >
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onClear}
                disabled={!rawText && !uploadedFile && !hasScanned}
                title="Clear workspace from memory"
                aria-label="Clear workspace"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-500/12 hover:text-red-600 disabled:opacity-35 dark:text-[#94A3B8] dark:hover:bg-red-500/15 dark:hover:text-[#F87171]"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>

            {/* Right File Status + Primary Scan CTA */}
            <div className="flex items-center gap-2">
              {uploadedFile ? (
                <div className="inline-flex h-8 max-w-[200px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 text-[11px] text-slate-700 dark:border-white/[0.08] dark:bg-[#1E1E24] dark:text-[#F8FAFC]">
                  {uploadedFile.type === 'csv' ? (
                    <FileSpreadsheet className="h-3.5 w-3.5 shrink-0 text-[#7C3AED] dark:text-[#A78BFA]" />
                  ) : (
                    <FileText className="h-3.5 w-3.5 shrink-0 text-[#7C3AED] dark:text-[#A78BFA]" />
                  )}
                  <span className="truncate font-mono">{uploadedFile.name}</span>
                  <span className="hidden sm:inline text-slate-400 dark:text-[#8E89AC]">
                    {formatBytes(uploadedFile.size)}
                  </span>
                  <button
                    type="button"
                    onClick={onRemoveFile}
                    aria-label="Remove uploaded file"
                    className="ml-0.5 rounded-sm p-0.5 text-slate-400 hover:text-red-500 dark:hover:text-[#F87171]"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition-colors hover:border-[#8B5CF6]/50 dark:border-white/[0.08] dark:bg-[#1E1E24] dark:text-[#F8FAFC] dark:hover:border-[#8B5CF6]/60 whitespace-nowrap"
                >
                  <Upload className="h-3.5 w-3.5 text-[#7C3AED] dark:text-[#A78BFA]" aria-hidden="true" />
                  <span>{isReadingFile ? 'Reading...' : 'Upload .TXT / .CSV'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onScan}
                disabled={!rawText.trim() || isScanning}
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] px-3.5 text-xs font-semibold text-white shadow-md shadow-[#8B5CF6]/25 transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A78BFA] disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap"
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

          {/* MAIN STUDIO STAGE: Editorial Document Canvas + Floating Violet-Dark Preview Window */}
          <div className="relative flex flex-1 flex-col overflow-hidden lg:flex-row">
            {/* Signature Floating 3D Violet Bubbles Backdrop matching Page 1 */}
            <span
              aria-hidden="true"
              className="veltrix-orb-sphere pointer-events-none absolute -left-14 -top-12 hidden h-36 w-36 opacity-25 dark:block"
            />
            <span
              aria-hidden="true"
              className="veltrix-orb-sphere pointer-events-none absolute left-[38%] -top-8 hidden h-16 w-16 opacity-20 blur-[0.5px] dark:block"
            />
            <span
              aria-hidden="true"
              className="veltrix-orb-sphere pointer-events-none absolute left-10 bottom-14 hidden h-10 w-10 opacity-25 dark:block"
            />
            <span
              aria-hidden="true"
              className="veltrix-orb-sphere pointer-events-none absolute left-[34%] -bottom-14 hidden h-32 w-32 opacity-22 dark:block"
            />

            {/* LEFT / CENTER EDITORIAL DOCUMENT CANVAS */}
            <div
              className={`relative z-10 flex min-w-0 flex-1 flex-col bg-white dark:bg-transparent ${
                mobileTab === 'original' ? 'flex' : 'hidden lg:flex'
              }`}
            >
              {/* Editorial Document Title Header */}
              <div className="px-6 pt-7 pb-3 sm:px-10">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h1 className="text-xl font-bold tracking-[0.06em] text-slate-900 text-balance sm:text-2xl dark:text-[#F8FAFC]">
                    {documentHeading}
                  </h1>
                  <span className="font-mono text-[11px] tabular-nums text-slate-500 dark:text-[#8E89AC]">
                    {charCount.toLocaleString()} chars · {wordCount.toLocaleString()} words ·{' '}
                    {isCSVMode ? 'CSV' : uploadedFile ? 'TXT' : 'Text'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-[#94A3B8]">
                  Paste raw text or drop a local file below to detect and redact PII entirely inside
                  your browser. Press{' '}
                  <kbd className="font-mono text-slate-700 dark:text-[#E2E8F0]">⌘/Ctrl+Enter</kbd>{' '}
                  to sanitize.
                </p>
              </div>

              {/* Active Category Filter Notice */}
              {activeCategoryFilter !== 'ALL' && hasScanned && (
                <div className="mx-6 mb-2 flex items-center justify-between rounded-xl border border-[#8B5CF6]/35 bg-[#8B5CF6]/10 px-3.5 py-1.5 text-xs sm:mx-10">
                  <span className="text-slate-700 dark:text-[#F8FAFC]">
                    Filtering highlights by{' '}
                    <strong className="font-mono text-[#7C3AED] dark:text-[#A78BFA]">
                      {activeCategoryFilter}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={onClearCategoryFilter}
                    className="font-semibold text-[#7C3AED] underline underline-offset-4 hover:text-[#6D28D9] dark:text-[#A78BFA]"
                  >
                    Show all
                  </button>
                </div>
              )}

              {/* Editorial Writing / Highlight Reading Body */}
              <div className="relative flex flex-1 flex-col min-h-[430px]">
                {leftViewMode === 'highlight' && hasScanned ? (
                  <HighlightedText
                    text={rawText}
                    detections={highlightDetections}
                    showHighlights={showHighlights}
                    onToggleHighlights={onToggleHighlights}
                    activeCategoryFilter={activeCategoryFilter}
                    fontClass={activeFont.className}
                    fontSizePx={activeFontSize}
                  />
                ) : (
                  <div className="flex flex-1 flex-col">
                    <textarea
                      value={rawText}
                      onChange={(e) => onChangeText(e.target.value)}
                      spellCheck={false}
                      aria-label="Original document text"
                      placeholder="Privacy is the ability of an individual or group to protect sensitive information selectively. Paste customer records, support logs, notes, or CSV data here—or choose a sample dataset below to test VELTRIX locally..."
                      className={`min-h-[370px] w-full flex-1 resize-none bg-transparent px-6 py-4 leading-7 text-slate-800 placeholder:text-slate-400 focus:outline-none sm:px-10 dark:text-[#E2E8F0] dark:placeholder:text-[#7E789E] ${activeFont.className}`}
                      style={{ fontSize: `${activeFontSize}px` }}
                    />

                    {/* Subtle Editorial Starter Links in Page 1's Violet Accent */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-6 py-3 text-xs text-slate-500 sm:px-10 dark:border-white/[0.06] dark:text-[#8E89AC]">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span>Quick start:</span>
                        <button
                          type="button"
                          onClick={onLoadDemoText}
                          className="font-medium text-[#7C3AED] underline decoration-[#8B5CF6]/50 underline-offset-4 transition-colors hover:text-[#6D28D9] dark:text-[#A78BFA] dark:hover:text-[#C4B5FD]"
                        >
                          load sample text
                        </button>
                        <button
                          type="button"
                          onClick={onLoadDemoCSV}
                          className="font-medium text-[#7C3AED] underline decoration-[#8B5CF6]/50 underline-offset-4 transition-colors hover:text-[#6D28D9] dark:text-[#A78BFA] dark:hover:text-[#C4B5FD]"
                        >
                          load sample CSV
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="font-medium text-[#7C3AED] underline decoration-[#8B5CF6]/50 underline-offset-4 transition-colors hover:text-[#6D28D9] dark:text-[#A78BFA] dark:hover:text-[#C4B5FD]"
                        >
                          upload local file
                        </button>
                      </div>

                      <span className="font-mono text-[11px] text-slate-400 dark:text-[#7E789E]">
                        100% browser memory
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT FLOATING / ELEVATED SANITIZED PREVIEW WINDOW */}
            {(viewerVisible || mobileTab === 'sanitized') && (
              <div
                className={`relative z-10 flex shrink-0 flex-col p-3 sm:p-4 lg:py-4 lg:pr-4 lg:pl-0 ${
                  mobileTab === 'sanitized' ? 'flex w-full' : 'hidden lg:flex'
                } ${viewerExpanded ? 'lg:w-[60%]' : 'lg:w-[440px] xl:w-[490px]'}`}
              >
                <div className="flex h-full min-h-[490px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-white/[0.09] dark:bg-[#171232]/90 dark:shadow-2xl dark:shadow-black/60">
                  {/* Floating Window Title Chrome Bar */}
                  <div className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-slate-100 px-3.5 dark:border-white/[0.07] dark:bg-[#1E1A36]">
                    <span className="truncate font-mono text-[11px] font-medium text-slate-700 dark:text-[#E2E8F0]">
                      {outputFileName}
                    </span>

                    <div className="flex items-center gap-1 text-slate-500 dark:text-[#94A3B8]">
                      <button
                        type="button"
                        onClick={() => setViewerExpanded((prev) => !prev)}
                        title={viewerExpanded ? 'Restore split width' : 'Expand preview window'}
                        aria-label={viewerExpanded ? 'Restore preview width' : 'Expand preview window'}
                        className="hidden h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-slate-200 hover:text-slate-900 lg:inline-flex dark:hover:bg-white/[0.08] dark:hover:text-[#F8FAFC]"
                      >
                        {viewerExpanded ? (
                          <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={!hasScanned}
                        onClick={() =>
                          setRightViewMode((prev) =>
                            prev === 'sanitized' ? 'compare' : 'sanitized'
                          )
                        }
                        title="Toggle Before / After Diff comparison"
                        aria-label="Toggle Diff comparison"
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors disabled:opacity-35 ${
                          rightViewMode === 'compare'
                            ? 'bg-[#8B5CF6]/25 text-[#7C3AED] dark:text-[#C4B5FD]'
                            : 'hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-white/[0.08] dark:hover:text-[#F8FAFC]'
                        }`}
                      >
                        <Columns2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setViewerVisible(false)}
                        title="Minimize preview window"
                        aria-label="Minimize preview window"
                        className="hidden h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-slate-200 hover:text-slate-900 lg:inline-flex dark:hover:bg-white/[0.08] dark:hover:text-[#F8FAFC]"
                      >
                        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {/* Secondary Compact Viewer Toolbar */}
                  <div className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-slate-200/80 bg-slate-50 px-3 text-[11px] dark:border-white/[0.06] dark:bg-[#191335]/90">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate font-mono tabular-nums text-slate-600 dark:text-[#A6AAB8]">
                        {hasScanned && scanResult
                          ? `${scanResult.stats.totalRedactions} redacted (${scanResult.stats.uniqueCategories} types)`
                          : `${enabledDetectorCount} detectors ready`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 text-slate-500 dark:text-[#94A3B8]">
                      <button
                        type="button"
                        onClick={() => setViewerZoom((z) => Math.max(85, z - 10))}
                        title="Zoom out output text"
                        aria-label="Zoom out output text"
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-white/[0.08] dark:hover:text-[#F8FAFC]"
                      >
                        <ZoomOut className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <span className="w-10 text-center font-mono text-[10px] tabular-nums text-slate-600 dark:text-[#E2E8F0]">
                        {viewerZoom}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setViewerZoom((z) => Math.min(135, z + 10))}
                        title="Zoom in output text"
                        aria-label="Zoom in output text"
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-white/[0.08] dark:hover:text-[#F8FAFC]"
                      >
                        <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {/* Scanning Progress Line */}
                  {isScanning && (
                    <div className="h-0.5 w-full overflow-hidden bg-slate-200 dark:bg-white/[0.06]">
                      <div className="h-full w-2/3 animate-pulse bg-gradient-to-r from-[#8B5CF6] via-[#A78BFA] to-[#34D399]" />
                    </div>
                  )}

                  {/* Viewer Body Content */}
                  <div className="relative flex-1 overflow-auto bg-white dark:bg-[#151129]">
                    {isScanning ? (
                      <div className="flex h-full min-h-[340px] flex-col items-center justify-center gap-3 p-6 text-center">
                        <Loader2 className="h-6 w-6 animate-spin text-[#8B5CF6] dark:text-[#A78BFA]" />
                        <p className="text-xs font-medium text-slate-600 dark:text-[#94A3B8]">
                          Scanning and sanitizing locally in your browser...
                        </p>
                      </div>
                    ) : !hasScanned ? (
                      /* Atmospheric Violet Bubble + Cipher Cover matching Page 1's 3D spheres card */
                      <div className="veltrix-orb-stage relative flex h-full min-h-[380px] flex-col justify-between overflow-hidden p-5 text-white">
                        {/* Signature 3D Floating Violet Bubbles matching Page 1 */}
                        <span
                          aria-hidden="true"
                          className="veltrix-orb-sphere pointer-events-none absolute -left-8 -top-10 h-28 w-28 opacity-85"
                        />
                        <span
                          aria-hidden="true"
                          className="veltrix-orb-sphere pointer-events-none absolute left-[46%] -top-6 h-12 w-12 opacity-70 blur-[0.5px]"
                        />
                        <span
                          aria-hidden="true"
                          className="veltrix-orb-sphere pointer-events-none absolute -right-5 top-10 h-16 w-16 opacity-80"
                        />
                        <span
                          aria-hidden="true"
                          className="veltrix-orb-sphere pointer-events-none absolute left-8 bottom-12 h-8 w-8 opacity-75"
                        />
                        <span
                          aria-hidden="true"
                          className="veltrix-orb-sphere pointer-events-none absolute -bottom-12 right-2 h-32 w-32 opacity-90"
                        />
                        <span
                          aria-hidden="true"
                          className="veltrix-orb-sphere pointer-events-none absolute -bottom-5 right-24 h-14 w-14 opacity-80"
                        />

                        {/* Subtle Hex Cipher Matrix Overlay */}
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 select-none overflow-hidden p-3 font-mono text-[13px] leading-7 tracking-[0.14em] text-[#DDD6FE]/[0.11]"
                        >
                          {HEX_MATRIX_ROWS.map((row, idx) => (
                            <p key={idx} className="whitespace-nowrap">
                              {row}
                            </p>
                          ))}
                        </div>

                        {/* Top Editorial Header */}
                        <div className="relative z-10 flex items-center justify-between gap-2 border-b border-violet-200/15 pb-3">
                          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-violet-200/75">
                            LOCAL SANITIZER
                          </span>
                          <div className="flex items-center gap-2 text-right">
                            <span className="text-sm font-semibold tracking-wider text-white">
                              VELTRIX
                            </span>
                            <span className="h-4 w-px bg-violet-200/30" aria-hidden="true" />
                            <span className="text-[9px] leading-tight uppercase tracking-wider text-violet-100/70">
                              On-Device
                              <br />
                              Privacy Engine
                            </span>
                          </div>
                        </div>

                        {/* Center Visual: Architectural Violet-Metallic Padlock + Editorial Cover Title */}
                        <div className="relative z-10 my-5 grid grid-cols-12 items-center gap-4">
                          <div className="col-span-5 flex items-center justify-center">
                            <svg
                              viewBox="0 0 110 138"
                              className="h-32 w-26 drop-shadow-[0_14px_24px_rgba(9,6,24,0.75)]"
                              aria-hidden="true"
                            >
                              <defs>
                                <linearGradient id="padlockShackle" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#EDE9FE" />
                                  <stop offset="50%" stopColor="#A78BFA" />
                                  <stop offset="100%" stopColor="#4C1D95" />
                                </linearGradient>
                                <linearGradient id="padlockBody" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#DDD6FE" />
                                  <stop offset="45%" stopColor="#8B5CF6" />
                                  <stop offset="100%" stopColor="#3B1D7A" />
                                </linearGradient>
                              </defs>
                              <path
                                d="M 30 58 V 36 C 30 18 80 18 80 36 V 58"
                                fill="none"
                                stroke="url(#padlockShackle)"
                                strokeWidth="11"
                                strokeLinecap="round"
                              />
                              <rect
                                x="16"
                                y="54"
                                width="78"
                                height="72"
                                rx="10"
                                fill="url(#padlockBody)"
                              />
                              <circle cx="55" cy="83" r="9" fill="#130B2E" />
                              <path d="M 51 86 L 59 86 L 61 106 L 49 106 Z" fill="#130B2E" />
                            </svg>
                          </div>

                          <div className="col-span-7 space-y-2">
                            <h2 className="text-lg font-bold leading-snug tracking-tight text-white">
                              The Effect of Sanitization on Sensitive Communications and Data
                            </h2>
                            <div className="space-y-0.5 text-[11px] text-violet-100/75">
                              <p className="font-mono text-[10px] uppercase tracking-widest text-[#C4B5FD]">
                                Active Engine Profile
                              </p>
                              <p>{enabledDetectorCount} Built-in PII Detectors</p>
                              <p className="capitalize">Redaction Mode: {redactionMode}</p>
                              <p>Zero Cloud &amp; Zero Telemetry</p>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Action Strip inside Cover */}
                        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-t border-violet-200/15 pt-3.5">
                          <span className="text-[10px] uppercase tracking-wider text-violet-100/65">
                            Ready for local scan
                          </span>

                          <div className="flex items-center gap-2">
                            {!rawText.trim() && (
                              <button
                                type="button"
                                onClick={onLoadDemoText}
                                className="rounded-lg border border-violet-200/25 bg-white/10 px-2.5 py-1.5 text-[11px] font-medium text-white backdrop-blur-xs transition-colors hover:bg-white/20"
                              >
                                Load Sample
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={rawText.trim() ? onScan : onLoadDemoCSV}
                              className="rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm shadow-[#8B5CF6]/35 transition-all hover:brightness-110"
                            >
                              {rawText.trim() ? 'Scan Document' : 'Try CSV Sample'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : rightViewMode === 'compare' ? (
                      <div className="divide-y divide-slate-200/70 font-mono text-xs dark:divide-white/[0.06]">
                        {diffRows.map((row) => (
                          <div
                            key={row.lineNum}
                            className={`grid grid-cols-1 gap-1 px-4 py-2 sm:grid-cols-2 sm:gap-3 ${
                              row.changed ? 'bg-[#8B5CF6]/8 dark:bg-[#8B5CF6]/12' : ''
                            }`}
                          >
                            <div className="min-w-0 break-words text-slate-500 dark:text-[#94A3B8]">
                              <span className="mr-2 select-none text-[10px] tabular-nums opacity-60">
                                {row.lineNum}
                              </span>
                              <span
                                className={row.changed ? 'line-through decoration-red-400/70' : ''}
                              >
                                {row.before || ' '}
                              </span>
                            </div>
                            <div className="min-w-0 break-words text-slate-900 dark:text-[#F8FAFC]">
                              <span
                                className={
                                  row.changed ? 'text-emerald-700 dark:text-[#34D399]' : ''
                                }
                              >
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
                        fontClass={activeFont.id === 'serif' ? 'font-mono' : activeFont.className}
                        fontSizePx={viewerFontSize}
                      />
                    )}
                  </div>

                  {/* Floating Window Footer Export Strip */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/[0.06] dark:bg-[#191335]/90">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleCopySanitized}
                        disabled={!hasScanned || !sanitizedText}
                        className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-800 transition-colors hover:border-[#8B5CF6]/50 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap dark:border-white/[0.09] dark:bg-[#1E1A36] dark:text-[#F8FAFC]"
                      >
                        {copiedSanitized ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600 dark:text-[#34D399]" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={onDownloadTxt}
                        disabled={!hasScanned || !sanitizedText}
                        className="inline-flex h-7 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-700 transition-colors hover:border-[#8B5CF6]/50 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap dark:border-white/[0.09] dark:bg-[#1E1A36] dark:text-[#E2E8F0]"
                      >
                        <FileText className="h-3 w-3 text-[#7C3AED] dark:text-[#A78BFA]" />
                        <span>TXT</span>
                      </button>

                      {isCSVMode && (
                        <button
                          type="button"
                          onClick={onDownloadCsv}
                          disabled={!hasScanned || !sanitizedText}
                          className="inline-flex h-7 items-center gap-1 rounded-lg bg-[#7C5CFC] px-2 text-[11px] font-semibold text-white transition-colors hover:bg-[#8B5CF6] disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap"
                        >
                          <FileSpreadsheet className="h-3 w-3" />
                          <span>CSV</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={onDownloadReport}
                        disabled={!hasScanned || !scanResult}
                        title="Download PII-free summary report"
                        className="inline-flex h-7 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-600 transition-colors hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap dark:border-white/[0.09] dark:bg-[#1E1A36] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]"
                      >
                        <Download className="h-3 w-3" />
                        <span>Report</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={onOpenSettings}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-[#7C3AED] hover:underline whitespace-nowrap dark:text-[#A78BFA]"
                    >
                      <SlidersHorizontal className="h-3 w-3" />
                      <span>Rules</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Minimized Floating Viewer Re-open Dock (desktop only) */}
            {!viewerVisible && (
              <button
                type="button"
                onClick={() => setViewerVisible(true)}
                className="absolute bottom-4 right-4 z-20 hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-xl transition-colors hover:border-[#8B5CF6]/50 lg:inline-flex dark:border-white/[0.1] dark:bg-[#1E1A36] dark:text-[#F8FAFC]"
              >
                <PanelRight className="h-3.5 w-3.5 text-[#7C3AED] dark:text-[#A78BFA]" />
                <span>Open Sanitized Viewer</span>
                {hasScanned && scanResult && (
                  <span className="font-mono text-[11px] text-emerald-700 dark:text-[#34D399]">
                    ({scanResult.stats.totalRedactions})
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* RIGHT SLIM UTILITY ICON RAIL */}
        <aside
          aria-label="Studio utility rail"
          className="hidden xl:flex w-11 shrink-0 flex-col items-center justify-between border-l border-slate-200 bg-slate-50/90 py-3 dark:border-white/[0.06] dark:bg-[#131318]"
        >
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setViewerVisible((prev) => !prev)}
              title={viewerVisible ? 'Hide Sanitized Viewer' : 'Show Sanitized Viewer'}
              aria-label="Toggle Sanitized Viewer"
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                viewerVisible
                  ? 'bg-[#8B5CF6]/18 text-[#7C3AED] dark:bg-[#8B5CF6]/22 dark:text-[#A78BFA]'
                  : 'text-slate-500 hover:bg-slate-200/70 dark:text-[#8E89AC] dark:hover:bg-white/[0.06]'
              }`}
            >
              <PanelRight className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => scrollToElement('veltrix-stats')}
              title="Jump to Detection Statistics"
              aria-label="Jump to Detection Statistics"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900 dark:text-[#8E89AC] dark:hover:bg-white/[0.06] dark:hover:text-[#F8FAFC]"
            >
              <BarChart3 className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => scrollToElement(isCSVMode ? 'veltrix-csv' : 'veltrix-insights')}
              title={isCSVMode ? 'Jump to CSV Analyzer' : 'Jump to Detection Insights'}
              aria-label="Jump to Insights or CSV"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900 dark:text-[#8E89AC] dark:hover:bg-white/[0.06] dark:hover:text-[#F8FAFC]"
            >
              <Table2 className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              title="Redaction Settings"
              aria-label="Redaction Settings"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900 dark:text-[#8E89AC] dark:hover:bg-white/[0.06] dark:hover:text-[#F8FAFC]"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenHelp}
            title="Verify Local Privacy"
            aria-label="Verify Local Privacy"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7C3AED] transition-colors hover:bg-slate-200/70 dark:text-[#A78BFA] dark:hover:bg-white/[0.06]"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </button>
        </aside>
      </div>
    </section>
  );
}
