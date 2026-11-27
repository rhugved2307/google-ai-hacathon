import { PanelRight, Upload } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { scanAndSanitizeText } from '../engine/detector';
import type {
  CategoryFilter,
  CustomRule,
  Detection,
  LeftViewMode,
  MobileStudioTab,
  PIICategory,
  RedactionMode,
  RightViewMode,
  ScanResult,
  UploadedFileInfo,
} from '../engine/types';
import { countWords, readLocalFile } from '../utils/fileUtils';
import { getOutputFilename } from '../utils/formatting';
import { ErrorBoundary } from './ErrorBoundary';
import { type DiffLineRow } from './workspace/DiffComparisonView';
import { DocumentEditorPane } from './workspace/DocumentEditorPane';
import { SanitizedPreviewWindow } from './workspace/SanitizedPreviewWindow';
import { StudioLeftRail } from './workspace/StudioLeftRail';
import { StudioRightRail } from './workspace/StudioRightRail';
import { StudioToolbar, type StudioFontOption } from './workspace/StudioToolbar';

export interface WorkspaceProps {
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
  leftViewMode: LeftViewMode;
  onChangeLeftViewMode: (mode: LeftViewMode) => void;
  showHighlights: boolean;
  onToggleHighlights: () => void;
  activeCategoryFilter: CategoryFilter;
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
  mobileTab: MobileStudioTab;
  onChangeMobileTab: (tab: MobileStudioTab) => void;
}

const FONT_FAMILIES: readonly StudioFontOption[] = [
  { id: 'serif', label: 'Serif', className: 'font-serif' },
  { id: 'mono', label: 'Mono', className: 'font-mono' },
  { id: 'sans', label: 'Sans', className: 'font-sans' },
];

const FONT_SIZES = [14, 15, 16, 18] as const;

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
  const [rightViewMode, setRightViewMode] = useState<RightViewMode>('sanitized');
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
  const copyFeedbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyFeedbackTimerRef.current !== null) {
        window.clearTimeout(copyFeedbackTimerRef.current);
      }
    };
  }, []);

  const activeFont = FONT_FAMILIES[fontIdx] ?? FONT_FAMILIES[0];
  const activeFontSize = FONT_SIZES[fontSizeIdx] ?? 16;
  const viewerFontSize = Math.round((13 * viewerZoom) / 100);

  const charCount = rawText.length;
  const wordCount = useMemo(() => countWords(rawText), [rawText]);
  const sanitizedText = scanResult?.sanitizedText ?? '';

  const enabledDetectorCount = useMemo(
    () => Object.values(enabledCategories).filter(Boolean).length,
    [enabledCategories]
  );

  const outputFileName = getOutputFilename(uploadedFile, isCSVMode);

  const documentHeading = uploadedFile
    ? uploadedFile.name.replace(/\.[^/.]+$/, '').toUpperCase()
    : 'YOUR PRIVACY MATTERS';

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

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
    try {
      return scanAndSanitizeText(rawText, {
        redactionMode,
        customReplacements,
        enabledCategories,
        customRules,
      }).detections;
    } catch {
      return [];
    }
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

  const diffRows: DiffLineRow[] = useMemo(() => {
    if (!hasScanned || rightViewMode !== 'compare') return [];
    const beforeLines = rawText.split(/\r?\n/);
    const afterLines = sanitizedText.split(/\r?\n/);
    const maxLen = Math.max(beforeLines.length, afterLines.length);
    const rows: DiffLineRow[] = [];
    for (let i = 0; i < maxLen; i++) {
      const before = beforeLines[i] ?? '';
      const after = afterLines[i] ?? '';
      rows.push({ lineNum: i + 1, before, after, changed: before !== after });
    }
    return rows;
  }, [hasScanned, rightViewMode, rawText, sanitizedText]);

  const handleCopySanitized = () => {
    onCopySanitized();
    setCopiedSanitized(true);
    if (copyFeedbackTimerRef.current !== null) {
      window.clearTimeout(copyFeedbackTimerRef.current);
    }
    copyFeedbackTimerRef.current = window.setTimeout(() => setCopiedSanitized(false), 1600);
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

      {/* Main Document Studio Frame */}
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

        <StudioLeftRail
          expanded={railExpanded}
          onToggleExpanded={() => setRailExpanded((prev) => !prev)}
          hasUploadedFile={Boolean(uploadedFile)}
          isCSVMode={isCSVMode}
          onBackToOverview={onBackToOverview}
          onTriggerUpload={triggerFilePicker}
          onLoadDemoText={onLoadDemoText}
          onLoadDemoCSV={onLoadDemoCSV}
          onOpenSettings={onOpenSettings}
          onOpenHelp={onOpenHelp}
        />

        {/* CENTER + FLOATING PREVIEW STUDIO COLUMN */}
        <div className="flex min-w-0 flex-1 flex-col">
          <StudioToolbar
            activeFont={activeFont}
            activeFontSize={activeFontSize}
            onCycleFont={() => setFontIdx((prev) => (prev + 1) % FONT_FAMILIES.length)}
            onCycleFontSize={() => setFontSizeIdx((prev) => (prev + 1) % FONT_SIZES.length)}
            leftViewMode={leftViewMode}
            onChangeLeftViewMode={onChangeLeftViewMode}
            redactionMode={redactionMode}
            onChangeRedactionMode={onChangeRedactionMode}
            liveScan={liveScan}
            onToggleLiveScan={onToggleLiveScan}
            canUndo={canUndo}
            onUndo={onUndo}
            rawText={rawText}
            hasScanned={hasScanned}
            isScanning={isScanning}
            isReadingFile={isReadingFile}
            uploadedFile={uploadedFile}
            onCopyOriginal={onCopyOriginal}
            onClear={onClear}
            onRemoveFile={onRemoveFile}
            onTriggerUpload={triggerFilePicker}
            onScan={onScan}
          />

          {/* MAIN STUDIO STAGE: Editorial Document Canvas + Floating Sanitized Preview Window */}
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

            <ErrorBoundary sectionName="Document Editor" onReset={() => onChangeLeftViewMode('edit')}>
              <DocumentEditorPane
                documentHeading={documentHeading}
                charCount={charCount}
                wordCount={wordCount}
                isCSVMode={isCSVMode}
                uploadedFile={uploadedFile}
                rawText={rawText}
                onChangeText={onChangeText}
                hasScanned={hasScanned}
                leftViewMode={leftViewMode}
                highlightDetections={highlightDetections}
                showHighlights={showHighlights}
                onToggleHighlights={onToggleHighlights}
                activeCategoryFilter={activeCategoryFilter}
                onClearCategoryFilter={onClearCategoryFilter}
                fontClassName={activeFont.className}
                fontSizePx={activeFontSize}
                mobileTab={mobileTab}
                onLoadDemoText={onLoadDemoText}
                onLoadDemoCSV={onLoadDemoCSV}
                onTriggerUpload={triggerFilePicker}
              />
            </ErrorBoundary>

            {(viewerVisible || mobileTab === 'sanitized') && (
              <ErrorBoundary
                sectionName="Sanitized Preview"
                onReset={() => setRightViewMode('sanitized')}
              >
                <SanitizedPreviewWindow
                  outputFileName={outputFileName}
                  mobileTab={mobileTab}
                  viewerExpanded={viewerExpanded}
                  onToggleExpanded={() => setViewerExpanded((prev) => !prev)}
                  onMinimize={() => setViewerVisible(false)}
                  rightViewMode={rightViewMode}
                  onToggleRightViewMode={() =>
                    setRightViewMode((prev) => (prev === 'sanitized' ? 'compare' : 'sanitized'))
                  }
                  viewerZoom={viewerZoom}
                  onZoomOut={() => setViewerZoom((z) => Math.max(85, z - 10))}
                  onZoomIn={() => setViewerZoom((z) => Math.min(135, z + 10))}
                  viewerFontSize={viewerFontSize}
                  viewerFontClass={activeFont.id === 'serif' ? 'font-mono' : activeFont.className}
                  isScanning={isScanning}
                  hasScanned={hasScanned}
                  scanResult={scanResult}
                  enabledDetectorCount={enabledDetectorCount}
                  redactionMode={redactionMode}
                  rawText={rawText}
                  sanitizedText={sanitizedText}
                  isCSVMode={isCSVMode}
                  activeCategoryFilter={activeCategoryFilter}
                  diffRows={diffRows}
                  copiedSanitized={copiedSanitized}
                  onCopySanitized={handleCopySanitized}
                  onDownloadTxt={onDownloadTxt}
                  onDownloadCsv={onDownloadCsv}
                  onDownloadReport={onDownloadReport}
                  onOpenSettings={onOpenSettings}
                  onLoadDemoText={onLoadDemoText}
                  onLoadDemoCSV={onLoadDemoCSV}
                  onScan={onScan}
                />
              </ErrorBoundary>
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

        <StudioRightRail
          viewerVisible={viewerVisible}
          isCSVMode={isCSVMode}
          onToggleViewer={() => setViewerVisible((prev) => !prev)}
          onJumpToSection={scrollToElement}
          onOpenSettings={onOpenSettings}
          onOpenHelp={onOpenHelp}
        />
      </div>
    </section>
  );
}
