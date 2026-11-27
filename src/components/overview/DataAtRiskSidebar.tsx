import { AlertCircle, ArrowUpRight, ChevronDown, FileText } from 'lucide-react';
import { useState } from 'react';
import type { PresetKey } from '../../engine/types';

export interface RiskDatasetCard {
  readonly id: string;
  readonly presetKey?: PresetKey;
  readonly name: string;
  readonly updatedLabel: string;
  readonly severity: 'critical' | 'warning';
  readonly line1: string;
  readonly line2: string;
  readonly totalFindings: number;
  readonly isLiveCurrent?: boolean;
}

interface DataAtRiskSidebarProps {
  cards: RiskDatasetCard[];
  searchQuery: string;
  onOpenWorkspace: () => void;
  onLoadAndScanPreset: (preset: PresetKey) => void;
}

export function DataAtRiskSidebar({
  cards,
  searchQuery,
  onOpenWorkspace,
  onLoadAndScanPreset,
}: DataAtRiskSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      aria-label="Data at risk"
      className="flex flex-col rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm lg:col-span-4 dark:border-white/[0.06] dark:bg-[#131318] dark:shadow-2xl dark:shadow-black/40"
    >
      <div className="flex items-center justify-between gap-2 pb-4">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">Data at risk</h2>
          <span className="font-mono text-xs tabular-nums text-slate-400 dark:text-[#7A7E91]">
            {cards.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-label={collapsed ? 'Expand datasets list' : 'Collapse datasets list'}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-white/[0.07] dark:text-[#94A3B8] dark:hover:bg-white/[0.12]"
        >
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${collapsed ? '-rotate-90' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {!collapsed && (
        <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
          {cards.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500 dark:border-white/10 dark:text-[#94A3B8]">
              No datasets match &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            cards.map((card) => {
              const badgeBg =
                card.severity === 'critical'
                  ? 'bg-[#EF4444] text-white'
                  : 'bg-[#F59E0B] text-white';

              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => {
                    if (card.isLiveCurrent) {
                      onOpenWorkspace();
                    } else if (card.presetKey) {
                      onLoadAndScanPreset(card.presetKey);
                    }
                  }}
                  className="group block w-full rounded-2xl border border-slate-200/80 bg-slate-50 p-4 text-left transition-all hover:border-[#8B5CF6]/50 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] dark:border-white/[0.05] dark:bg-[#1E1E24] dark:hover:border-[#8B5CF6]/45 dark:hover:bg-[#24242C]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${badgeBg}`}
                        aria-hidden="true"
                      >
                        <AlertCircle className="h-3.5 w-3.5" />
                      </span>
                      <span className="truncate font-mono text-xs font-semibold text-slate-900 group-hover:text-[#7C3AED] dark:text-[#F8FAFC] dark:group-hover:text-[#A78BFA]">
                        {card.name}
                      </span>
                    </div>
                    <span className="shrink-0 text-[11px] text-slate-400 dark:text-[#7A7E91]">
                      {card.updatedLabel}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 pl-7 text-xs text-slate-600 dark:text-[#A6AAB8]">
                    <p className="truncate">{card.line1}</p>
                    <p className="truncate">{card.line2}</p>
                  </div>
                </button>
              );
            })
          )}

          <button
            type="button"
            onClick={onOpenWorkspace}
            className="flex w-full items-center justify-between rounded-2xl border border-dashed border-slate-300 bg-transparent px-4 py-3.5 text-left text-xs font-medium text-slate-600 transition-colors hover:border-[#8B5CF6]/60 hover:text-[#7C3AED] dark:border-white/12 dark:text-[#94A3B8] dark:hover:border-[#8B5CF6]/60 dark:hover:text-[#A78BFA]"
          >
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4" aria-hidden="true" />
              <span>Paste your own text or upload .TXT / .CSV</span>
            </span>
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </aside>
  );
}
