import { CheckSquare, ShieldAlert, ShieldCheck, Square } from 'lucide-react';
import { CATEGORY_META } from '../../engine/patterns';
import type { CSVColumnSummary } from '../../engine/types';
import { getColumnStatusClass, getTypedCategoryEntries } from '../../utils/formatting';

interface CSVColumnsTableProps {
  columnSummaries: CSVColumnSummary[];
  onToggleColumn: (index: number) => void;
}

export function CSVColumnsTable({ columnSummaries, onToggleColumn }: CSVColumnsTableProps) {
  if (columnSummaries.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500 dark:border-white/[0.08] dark:text-[#94A3B8]">
        No CSV columns were detected in the current input.
      </div>
    );
  }

  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-white/[0.08]">
      <table className="w-full min-w-[600px] border-collapse text-left text-xs">
        <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 dark:bg-[#191335] dark:text-[#A6AAB8]">
          <tr className="border-b border-slate-200 dark:border-white/[0.08]">
            <th scope="col" className="w-16 px-3.5 py-2.5">
              Sanitize
            </th>
            <th scope="col" className="px-3.5 py-2.5">
              Column
            </th>
            <th scope="col" className="px-3.5 py-2.5 text-right">
              Detected PII
            </th>
            <th scope="col" className="px-3.5 py-2.5">
              Category Statistics
            </th>
            <th scope="col" className="px-3.5 py-2.5 text-right">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/70 dark:divide-[#283449]/70">
          {columnSummaries.map((col) => {
            const breakdownEntries = getTypedCategoryEntries(col.categoryBreakdown);
            const statusColor = getColumnStatusClass(col.status);

            return (
              <tr
                key={`${col.index}-${col.name}`}
                className="transition-colors hover:bg-slate-50 dark:hover:bg-[#1B2540]/60"
              >
                <td className="px-3.5 py-2.5">
                  <button
                    type="button"
                    onClick={() => onToggleColumn(col.index)}
                    aria-label={`${col.selected ? 'Exclude' : 'Include'} column ${col.name}`}
                    aria-pressed={col.selected}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#7C3AED] transition-colors hover:bg-[#8B5CF6]/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] dark:text-[#A78BFA]"
                  >
                    {col.selected ? (
                      <CheckSquare className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    )}
                  </button>
                </td>
                <td className="px-3.5 py-2.5 font-semibold text-slate-900 dark:text-[#F8FAFC]">
                  <span className="mr-2 font-mono text-[11px] font-normal text-slate-400">
                    #{col.index + 1}
                  </span>
                  {col.name}
                </td>
                <td className="px-3.5 py-2.5 text-right font-mono font-semibold tabular-nums text-slate-900 dark:text-[#F8FAFC]">
                  {col.detectedCount.toLocaleString()}
                </td>
                <td className="px-3.5 py-2.5">
                  {breakdownEntries.length === 0 ? (
                    <span className="text-slate-400 dark:text-[#64748B]">Clean column</span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px]">
                      {breakdownEntries.map(([cat, count]) => (
                        <span key={cat} className={CATEGORY_META[cat].textClass}>
                          {CATEGORY_META[cat].shortLabel} ({count})
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td
                  className={`px-3.5 py-2.5 text-right font-semibold whitespace-nowrap ${statusColor}`}
                >
                  <span className="inline-flex items-center justify-end gap-1">
                    {col.status === 'Sanitized' ? (
                      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : col.status === 'Excluded' ? (
                      <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : null}
                    <span>{col.status}</span>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
