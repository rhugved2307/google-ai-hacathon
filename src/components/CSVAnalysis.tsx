import {
  CheckSquare,
  FileSpreadsheet,
  ShieldAlert,
  ShieldCheck,
  Square,
  Table2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { parseCSV } from '../engine/csvParser';
import { CATEGORY_META } from '../engine/patterns';
import type { CSVScanResult, PIICategory } from '../engine/types';

interface CSVAnalysisProps {
  csvResult: CSVScanResult;
  onToggleColumn: (index: number) => void;
  onSanitizeAll: () => void;
  onSelectOnlyPII: () => void;
  onExcludeAll: () => void;
}

export function CSVAnalysis({
  csvResult,
  onToggleColumn,
  onSanitizeAll,
  onSelectOnlyPII,
  onExcludeAll,
}: CSVAnalysisProps) {
  const [subTab, setSubTab] = useState<'columns' | 'preview'>('columns');
  const { totalRows, totalColumns, columnsWithPII, columnSummaries, sanitizedCSV } = csvResult;
  const selectedCount = columnSummaries.filter((c) => c.selected).length;

  const previewParsed = useMemo(() => {
    if (subTab !== 'preview') return null;
    return parseCSV(sanitizedCSV);
  }, [subTab, sanitizedCSV]);

  return (
    <section
      id="veltrix-csv"
      aria-label="CSV analysis"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-white/[0.06] dark:bg-[#131318] dark:shadow-none"
    >
      {/* Header */}
      <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#22D3EE]/12 text-cyan-700 dark:bg-[#22D3EE]/15 dark:text-[#22D3EE]">
            <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">
              CSV Structure &amp; Column Analysis
            </h2>
            <p className="mt-0.5 font-mono text-xs tabular-nums text-slate-500 dark:text-[#94A3B8]">
              {totalRows.toLocaleString()} rows · {totalColumns} columns ·{' '}
              <span className="text-[#7C3AED] dark:text-[#A78BFA]">{columnsWithPII} sensitive</span>{' '}
              · {selectedCount} selected
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Columns vs Sanitized Table Preview toggle */}
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-[#283449] dark:bg-[#0B1020]">
            <button
              type="button"
              onClick={() => setSubTab('columns')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                subTab === 'columns'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-[#1B2540] dark:text-[#F8FAFC]'
                  : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]'
              }`}
            >
              Columns ({totalColumns})
            </button>
            <button
              type="button"
              onClick={() => setSubTab('preview')}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                subTab === 'preview'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-[#1B2540] dark:text-[#F8FAFC]'
                  : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]'
              }`}
            >
              <Table2 className="h-3 w-3" aria-hidden="true" />
              <span>Sanitized Preview</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onSanitizeAll}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-[#8B5CF6]/50 hover:text-[#7C3AED] whitespace-nowrap dark:border-[#283449] dark:bg-[#1B2540] dark:text-[#F8FAFC] dark:hover:border-[#8B5CF6]/60"
          >
            Sanitize All
          </button>
          <button
            type="button"
            onClick={onSelectOnlyPII}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-[#22D3EE]/60 hover:text-cyan-700 whitespace-nowrap dark:border-[#283449] dark:bg-[#1B2540] dark:text-[#F8FAFC] dark:hover:border-[#22D3EE]/50"
          >
            Sensitive Only
          </button>
          <button
            type="button"
            onClick={onExcludeAll}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-red-400/50 hover:text-red-600 whitespace-nowrap dark:border-[#283449] dark:bg-[#1B2540] dark:text-[#94A3B8] dark:hover:text-[#F87171]"
          >
            Exclude All
          </button>
        </div>
      </div>

      {/* Sub-view 1: Column Selection & Stats Table */}
      {subTab === 'columns' && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-white/[0.08]">
          <table className="w-full min-w-[600px] border-collapse text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 dark:bg-[#191335] dark:text-[#A6AAB8]">
              <tr className="border-b border-slate-200 dark:border-white/[0.08]">
                <th scope="col" className="w-16 px-3.5 py-2.5">Sanitize</th>
                <th scope="col" className="px-3.5 py-2.5">Column</th>
                <th scope="col" className="px-3.5 py-2.5 text-right">Detected PII</th>
                <th scope="col" className="px-3.5 py-2.5">Category Statistics</th>
                <th scope="col" className="px-3.5 py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-[#283449]/70">
              {columnSummaries.map((col) => {
                const breakdownEntries = Object.entries(col.categoryBreakdown) as [
                  PIICategory,
                  number,
                ][];

                const statusColor =
                  col.status === 'Sanitized'
                    ? 'text-emerald-700 dark:text-[#34D399]'
                    : col.status === 'Excluded'
                      ? 'text-amber-700 dark:text-[#F59E0B]'
                      : 'text-slate-500 dark:text-[#94A3B8]';

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
      )}

      {/* Sub-view 2: Sanitized Tabular Preview */}
      {subTab === 'preview' && previewParsed && (
        <div className="mt-4 space-y-2">
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/[0.08]">
            <table className="w-full min-w-[640px] border-collapse text-left font-mono text-xs">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 dark:bg-[#191335] dark:text-[#A6AAB8]">
                <tr className="border-b border-slate-200 dark:border-white/[0.08]">
                  <th scope="col" className="w-12 px-3 py-2.5">#</th>
                  {previewParsed.headers.map((header, idx) => (
                    <th key={`${idx}-${header}`} scope="col" className="px-3 py-2.5 whitespace-nowrap">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-[#283449]/70">
                {previewParsed.rows.slice(0, 12).map((row, rowIdx) => (
                  <tr
                    key={`row-${rowIdx}`}
                    className="hover:bg-slate-50 dark:hover:bg-[#1B2540]/50"
                  >
                    <td className="px-3 py-2 tabular-nums text-slate-400">{rowIdx + 1}</td>
                    {row.map((cell, colIdx) => {
                      const colMeta = columnSummaries[colIdx];
                      const wasSanitized =
                        colMeta && colMeta.selected && colMeta.detectedCount > 0;
                      return (
                        <td
                          key={`cell-${rowIdx}-${colIdx}`}
                          className={`max-w-[220px] truncate px-3 py-2 ${
                            wasSanitized
                              ? 'text-emerald-700 dark:text-[#34D399]'
                              : 'text-slate-700 dark:text-[#F8FAFC]'
                          }`}
                          title={cell}
                        >
                          {cell}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {previewParsed.rows.length > 12 && (
            <p className="text-right text-[11px] text-slate-500 dark:text-[#94A3B8]">
              Previewing first 12 of {previewParsed.rows.length.toLocaleString()} sanitized rows.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
