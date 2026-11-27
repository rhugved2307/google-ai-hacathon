import {
  Copy,
  FileSpreadsheet,
  FileText,
  Highlighter,
  Loader2,
  Pencil,
  RotateCcw,
  ScanSearch,
  Trash2,
  Upload,
  X,
  Zap,
} from 'lucide-react';
import type { LeftViewMode, RedactionMode, UploadedFileInfo } from '../../engine/types';
import { formatBytes } from '../../utils/fileUtils';
import { REDACTION_MODE_OPTIONS } from '../../utils/formatting';

export interface StudioFontOption {
  readonly id: 'serif' | 'mono' | 'sans';
  readonly label: string;
  readonly className: string;
}

interface StudioToolbarProps {
  activeFont: StudioFontOption;
  activeFontSize: number;
  onCycleFont: () => void;
  onCycleFontSize: () => void;
  leftViewMode: LeftViewMode;
  onChangeLeftViewMode: (mode: LeftViewMode) => void;
  redactionMode: RedactionMode;
  onChangeRedactionMode: (mode: RedactionMode) => void;
  liveScan: boolean;
  onToggleLiveScan: () => void;
  canUndo: boolean;
  onUndo: () => void;
  rawText: string;
  hasScanned: boolean;
  isScanning: boolean;
  isReadingFile: boolean;
  uploadedFile: UploadedFileInfo | null;
  onCopyOriginal: () => void;
  onClear: () => void;
  onRemoveFile: () => void;
  onTriggerUpload: () => void;
  onScan: () => void;
}

export function StudioToolbar({
  activeFont,
  activeFontSize,
  onCycleFont,
  onCycleFontSize,
  leftViewMode,
  onChangeLeftViewMode,
  redactionMode,
  onChangeRedactionMode,
  liveScan,
  onToggleLiveScan,
  canUndo,
  onUndo,
  rawText,
  hasScanned,
  isScanning,
  isReadingFile,
  uploadedFile,
  onCopyOriginal,
  onClear,
  onRemoveFile,
  onTriggerUpload,
  onScan,
}: StudioToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/[0.06] dark:bg-[#131318]/90">
      {/* Left Formatting & View Controls */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={onCycleFont}
          title={`Typography: ${activeFont.label} (click to cycle)`}
          className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200/70 dark:text-[#E2E8F0] dark:hover:bg-white/[0.07]"
        >
          <span className={activeFont.className}>Aa</span>
          <span className="text-[10px] text-slate-400 dark:text-[#8E89AC]">{activeFont.label}</span>
        </button>

        <button
          type="button"
          onClick={onCycleFontSize}
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

        <span
          className="mx-0.5 hidden h-4 w-px bg-slate-200 sm:inline-block dark:bg-white/[0.08]"
          aria-hidden="true"
        />

        {/* Redaction Mode Switcher */}
        <div
          role="radiogroup"
          aria-label="Redaction mode"
          className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 dark:border-white/[0.08] dark:bg-[#191335]/70"
        >
          {REDACTION_MODE_OPTIONS.map((m) => {
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
            onClick={onTriggerUpload}
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
            {isScanning ? 'Scanning...' : hasScanned ? 'Rescan & Sanitize' : 'Scan & Sanitize'}
          </span>
        </button>
      </div>
    </div>
  );
}
