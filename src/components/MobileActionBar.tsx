import { Copy, ScanSearch, SlidersHorizontal } from 'lucide-react';

interface MobileActionBarProps {
  hasInput: boolean;
  isScanning: boolean;
  canCopySanitized: boolean;
  onScan: () => void;
  onCopySanitized: () => void;
  onOpenSettings: () => void;
}

export function MobileActionBar({
  hasInput,
  isScanning,
  canCopySanitized,
  onScan,
  onCopySanitized,
  onOpenSettings,
}: MobileActionBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 py-2.5 backdrop-blur-md lg:hidden dark:border-white/[0.06] dark:bg-[#0D0D12]/95">
      <div className="mx-auto flex max-w-lg items-center gap-2">
        <button
          type="button"
          onClick={onScan}
          disabled={!hasInput || isScanning}
          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] px-4 text-xs font-semibold text-white shadow-sm shadow-[#8B5CF6]/25 disabled:opacity-45 whitespace-nowrap"
        >
          <ScanSearch className="h-4 w-4" aria-hidden="true" />
          <span>{isScanning ? 'Scanning...' : 'Scan & Sanitize'}</span>
        </button>

        <button
          type="button"
          onClick={onCopySanitized}
          disabled={!canCopySanitized}
          aria-label="Copy sanitized output"
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 disabled:opacity-40 dark:border-white/[0.08] dark:bg-[#1C1C24] dark:text-[#F8FAFC]"
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
          <span>Copy</span>
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Open redaction settings"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 dark:border-white/[0.08] dark:bg-[#1C1C24] dark:text-[#F8FAFC]"
        >
          <SlidersHorizontal
            className="h-4 w-4 text-[#8B5CF6] dark:text-[#A78BFA]"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
}
