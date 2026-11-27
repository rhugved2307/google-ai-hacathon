import { BarChart3, PanelRight, ShieldCheck, SlidersHorizontal, Table2 } from 'lucide-react';

interface StudioRightRailProps {
  viewerVisible: boolean;
  isCSVMode: boolean;
  onToggleViewer: () => void;
  onJumpToSection: (elementId: string) => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}

export function StudioRightRail({
  viewerVisible,
  isCSVMode,
  onToggleViewer,
  onJumpToSection,
  onOpenSettings,
  onOpenHelp,
}: StudioRightRailProps) {
  return (
    <aside
      aria-label="Studio utility rail"
      className="hidden xl:flex w-11 shrink-0 flex-col items-center justify-between border-l border-slate-200 bg-slate-50/90 py-3 dark:border-white/[0.06] dark:bg-[#131318]"
    >
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={onToggleViewer}
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
          onClick={() => onJumpToSection('veltrix-stats')}
          title="Jump to Detection Statistics"
          aria-label="Jump to Detection Statistics"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900 dark:text-[#8E89AC] dark:hover:bg-white/[0.06] dark:hover:text-[#F8FAFC]"
        >
          <BarChart3 className="h-4 w-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => onJumpToSection(isCSVMode ? 'veltrix-csv' : 'veltrix-insights')}
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
  );
}
