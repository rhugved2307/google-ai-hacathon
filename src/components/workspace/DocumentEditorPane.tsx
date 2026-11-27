import type {
  CategoryFilter,
  Detection,
  LeftViewMode,
  MobileStudioTab,
  UploadedFileInfo,
} from '../../engine/types';
import { HighlightedText } from '../HighlightedText';

interface DocumentEditorPaneProps {
  documentHeading: string;
  charCount: number;
  wordCount: number;
  isCSVMode: boolean;
  uploadedFile: UploadedFileInfo | null;
  rawText: string;
  onChangeText: (text: string) => void;
  hasScanned: boolean;
  leftViewMode: LeftViewMode;
  highlightDetections: Detection[];
  showHighlights: boolean;
  onToggleHighlights: () => void;
  activeCategoryFilter: CategoryFilter;
  onClearCategoryFilter: () => void;
  fontClassName: string;
  fontSizePx: number;
  mobileTab: MobileStudioTab;
  onLoadDemoText: () => void;
  onLoadDemoCSV: () => void;
  onTriggerUpload: () => void;
}

export function DocumentEditorPane({
  documentHeading,
  charCount,
  wordCount,
  isCSVMode,
  uploadedFile,
  rawText,
  onChangeText,
  hasScanned,
  leftViewMode,
  highlightDetections,
  showHighlights,
  onToggleHighlights,
  activeCategoryFilter,
  onClearCategoryFilter,
  fontClassName,
  fontSizePx,
  mobileTab,
  onLoadDemoText,
  onLoadDemoCSV,
  onTriggerUpload,
}: DocumentEditorPaneProps) {
  return (
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
          Paste raw text or drop a local file below to detect and redact PII entirely inside your
          browser. Press{' '}
          <kbd className="font-mono text-slate-700 dark:text-[#E2E8F0]">⌘/Ctrl+Enter</kbd> to
          sanitize.
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
            fontClass={fontClassName}
            fontSizePx={fontSizePx}
          />
        ) : (
          <div className="flex flex-1 flex-col">
            <textarea
              value={rawText}
              onChange={(e) => onChangeText(e.target.value)}
              spellCheck={false}
              aria-label="Original document text"
              placeholder="Privacy is the ability of an individual or group to protect sensitive information selectively. Paste customer records, support logs, notes, or CSV data here—or choose a sample dataset below to test VELTRIX locally..."
              className={`min-h-[370px] w-full flex-1 resize-none bg-transparent px-6 py-4 leading-7 text-slate-800 placeholder:text-slate-400 focus:outline-none sm:px-10 dark:text-[#E2E8F0] dark:placeholder:text-[#7E789E] ${fontClassName}`}
              style={{ fontSize: `${fontSizePx}px` }}
            />

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
                  onClick={onTriggerUpload}
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
  );
}
