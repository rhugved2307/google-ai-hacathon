import { FileSpreadsheet, Table2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { parseCSV } from '../engine/csvParser';
import type { CSVScanResult } from '../engine/types';
import { ErrorBoundary } from './ErrorBoundary';
import { CSVColumnsTable } from './csv/CSVColumnsTable';
import { CSVPreviewTable } from './csv/CSVPreviewTable';

interface CSVAnalysisProps {
  csvResult: CSVScanResult;
  onToggleColumn: (index: number) => void;
  onSanitizeAll: () => void;
  onSelectOnlyPII: () => void;
  onExcludeAll: () => void;
}

type CSVSubTab = 'columns' | 'preview';

export function CSVAnalysis({
  csvResult,
  onToggleColumn,
  onSanitizeAll,
  onSelectOnlyPII,
  onExcludeAll,
}: CSVAnalysisProps) {
  const [subTab, setSubTab] = useState<CSVSubTab>('columns');
  const { totalRows, totalColumns, columnsWithPII, columnSummaries, sanitizedCSV } = csvResult;
  const selectedCount = columnSummaries.filter((c) => c.selected).length;

  const previewParsed = useMemo(() => {
    if (subTab !== 'preview') return null;
    try {
      return parseCSV(sanitizedCSV);
    } catch {
      return null;
    }
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

      <ErrorBoundary sectionName="CSV Analysis Table" onReset={() => setSubTab('columns')}>
        {subTab === 'columns' && (
          <CSVColumnsTable columnSummaries={columnSummaries} onToggleColumn={onToggleColumn} />
        )}

        {subTab === 'preview' && previewParsed && (
          <CSVPreviewTable parsed={previewParsed} columnSummaries={columnSummaries} />
        )}
      </ErrorBoundary>
    </section>
  );
}
