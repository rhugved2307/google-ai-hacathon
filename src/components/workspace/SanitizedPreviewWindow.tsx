import {
  Check,
  Columns2,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Maximize2,
  Minimize2,
  Minus,
  SlidersHorizontal,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type {
  CategoryFilter,
  MobileStudioTab,
  RedactionMode,
  RightViewMode,
  ScanResult,
} from '../../engine/types';
import { SanitizedTextView } from '../SanitizedTextView';
import { DiffComparisonView, type DiffLineRow } from './DiffComparisonView';
import { PreviewCoverStage } from './PreviewCoverStage';

interface SanitizedPreviewWindowProps {
  outputFileName: string;
  mobileTab: MobileStudioTab;
  viewerExpanded: boolean;
  onToggleExpanded: () => void;
  onMinimize: () => void;
  rightViewMode: RightViewMode;
  onToggleRightViewMode: () => void;
  viewerZoom: number;
  onZoomOut: () => void;
  onZoomIn: () => void;
  viewerFontSize: number;
  viewerFontClass: string;
  isScanning: boolean;
  hasScanned: boolean;
  scanResult: ScanResult | null;
  enabledDetectorCount: number;
  redactionMode: RedactionMode;
  rawText: string;
  sanitizedText: string;
  isCSVMode: boolean;
  activeCategoryFilter: CategoryFilter;
  diffRows: DiffLineRow[];
  copiedSanitized: boolean;
  onCopySanitized: () => void;
  onDownloadTxt: () => void;
  onDownloadCsv: () => void;
  onDownloadReport: () => void;
  onOpenSettings: () => void;
  onLoadDemoText: () => void;
  onLoadDemoCSV: () => void;
  onScan: () => void;
}

export function SanitizedPreviewWindow({
  outputFileName,
  mobileTab,
  viewerExpanded,
  onToggleExpanded,
  onMinimize,
  rightViewMode,
  onToggleRightViewMode,
  viewerZoom,
  onZoomOut,
  onZoomIn,
  viewerFontSize,
  viewerFontClass,
  isScanning,
  hasScanned,
  scanResult,
  enabledDetectorCount,
  redactionMode,
  rawText,
  sanitizedText,
  isCSVMode,
  activeCategoryFilter,
  diffRows,
  copiedSanitized,
  onCopySanitized,
  onDownloadTxt,
  onDownloadCsv,
  onDownloadReport,
  onOpenSettings,
  onLoadDemoText,
  onLoadDemoCSV,
  onScan,
}: SanitizedPreviewWindowProps) {
  return (
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
              onClick={onToggleExpanded}
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
              onClick={onToggleRightViewMode}
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
              onClick={onMinimize}
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
              onClick={onZoomOut}
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
              onClick={onZoomIn}
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
            <PreviewCoverStage
              enabledDetectorCount={enabledDetectorCount}
              redactionMode={redactionMode}
              hasInputText={Boolean(rawText.trim())}
              onLoadDemoText={onLoadDemoText}
              onLoadDemoCSV={onLoadDemoCSV}
              onScan={onScan}
            />
          ) : rightViewMode === 'compare' ? (
            <DiffComparisonView rows={diffRows} />
          ) : (
            <SanitizedTextView
              rawText={rawText}
              sanitizedText={sanitizedText}
              detections={scanResult?.detections ?? []}
              isCSVMode={isCSVMode}
              activeCategoryFilter={activeCategoryFilter}
              fontClass={viewerFontClass}
              fontSizePx={viewerFontSize}
            />
          )}
        </div>

        {/* Floating Window Footer Export Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/[0.06] dark:bg-[#191335]/90">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={onCopySanitized}
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
  );
}
