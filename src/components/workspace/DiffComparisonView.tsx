export interface DiffLineRow {
  readonly lineNum: number;
  readonly before: string;
  readonly after: string;
  readonly changed: boolean;
}

interface DiffComparisonViewProps {
  rows: DiffLineRow[];
}

export function DiffComparisonView({ rows }: DiffComparisonViewProps) {
  if (rows.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-500 dark:text-[#94A3B8]">
        No lines to compare.
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-200/70 font-mono text-xs dark:divide-white/[0.06]">
      {rows.map((row) => (
        <div
          key={row.lineNum}
          className={`grid grid-cols-1 gap-1 px-4 py-2 sm:grid-cols-2 sm:gap-3 ${
            row.changed ? 'bg-[#8B5CF6]/8 dark:bg-[#8B5CF6]/12' : ''
          }`}
        >
          <div className="min-w-0 break-words text-slate-500 dark:text-[#94A3B8]">
            <span className="mr-2 select-none text-[10px] tabular-nums opacity-60">
              {row.lineNum}
            </span>
            <span className={row.changed ? 'line-through decoration-red-400/70' : ''}>
              {row.before || ' '}
            </span>
          </div>
          <div className="min-w-0 break-words text-slate-900 dark:text-[#F8FAFC]">
            <span className={row.changed ? 'text-emerald-700 dark:text-[#34D399]' : ''}>
              {row.after || ' '}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
