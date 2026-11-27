import type { CSVColumnSummary, ParsedCSV } from '../../engine/types';

interface CSVPreviewTableProps {
  parsed: ParsedCSV;
  columnSummaries: CSVColumnSummary[];
  maxPreviewRows?: number;
}

export function CSVPreviewTable({
  parsed,
  columnSummaries,
  maxPreviewRows = 12,
}: CSVPreviewTableProps) {
  if (parsed.headers.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500 dark:border-white/[0.08] dark:text-[#94A3B8]">
        No sanitized CSV columns available to preview.
      </div>
    );
  }

  if (parsed.rows.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500 dark:border-white/[0.08] dark:text-[#94A3B8]">
        Header row detected ({parsed.headers.length} columns), with zero data rows.
      </div>
    );
  }

  const columnCount = parsed.headers.length;

  return (
    <div className="mt-4 space-y-2">
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/[0.08]">
        <table className="w-full min-w-[640px] border-collapse text-left font-mono text-xs">
          <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 dark:bg-[#191335] dark:text-[#A6AAB8]">
            <tr className="border-b border-slate-200 dark:border-white/[0.08]">
              <th scope="col" className="w-12 px-3 py-2.5">
                #
              </th>
              {parsed.headers.map((header, idx) => (
                <th
                  key={`${idx}-${header}`}
                  scope="col"
                  className="px-3 py-2.5 whitespace-nowrap"
                >
                  {header || `Column ${idx + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70 dark:divide-[#283449]/70">
            {parsed.rows.slice(0, maxPreviewRows).map((row, rowIdx) => (
              <tr key={`row-${rowIdx}`} className="hover:bg-slate-50 dark:hover:bg-[#1B2540]/50">
                <td className="px-3 py-2 tabular-nums text-slate-400">{rowIdx + 1}</td>
                {Array.from({ length: columnCount }, (_, colIdx) => {
                  const cell = row[colIdx] ?? '';
                  const colMeta = columnSummaries[colIdx];
                  const wasSanitized = Boolean(
                    colMeta && colMeta.selected && colMeta.detectedCount > 0
                  );
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
      {parsed.rows.length > maxPreviewRows && (
        <p className="text-right text-[11px] text-slate-500 dark:text-[#94A3B8]">
          Previewing first {maxPreviewRows} of {parsed.rows.length.toLocaleString()} sanitized rows.
        </p>
      )}
    </div>
  );
}
