import { CheckCircle2 } from 'lucide-react';
import type { SessionHistoryEntry } from '../../engine/types';
import { getBrowserStorageCounts } from '../../utils/storageAudit';

interface SessionHistoryTabProps {
  sessionHistory: SessionHistoryEntry[];
  onClearHistory: () => void;
}

export function SessionHistoryTab({ sessionHistory, onClearHistory }: SessionHistoryTabProps) {
  const { localStorageCount, sessionStorageCount } = getBrowserStorageCounts();

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-900 dark:text-[#F8FAFC]">
          Live Privacy Verification
        </h3>
        <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 text-xs dark:divide-[#283449] dark:border-[#283449]">
          {[
            ['Processing', '100% Browser-Only'],
            ['External Uploads', 'None'],
            ['Storage Keys', `localStorage: ${localStorageCount} · session: ${sessionStorageCount}`],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between px-3.5 py-2.5">
              <span className="text-slate-500 dark:text-[#94A3B8]">{k}</span>
              <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-emerald-700 dark:text-[#34D399]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {v}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-900 dark:text-[#F8FAFC]">
            In-Memory Session History ({sessionHistory.length})
          </h3>
          {sessionHistory.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className="text-xs font-medium text-red-600 hover:underline dark:text-[#F87171]"
            >
              Clear History
            </button>
          )}
        </div>

        {sessionHistory.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-500 dark:border-[#283449] dark:text-[#94A3B8]">
            No scans in this tab yet. Cleared automatically on reload.
          </p>
        ) : (
          <div className="space-y-2">
            {sessionHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs dark:border-[#283449] dark:bg-[#0F1629]"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900 dark:text-[#F8FAFC]">
                    {item.sourceName}
                  </p>
                  <p className="font-mono text-[11px] text-slate-500 dark:text-[#94A3B8]">
                    {item.timestamp} · {item.redactionMode}
                  </p>
                </div>
                <div className="text-right font-mono tabular-nums shrink-0">
                  <p className="font-semibold text-emerald-700 dark:text-[#34D399]">
                    {item.totalDetections} redacted
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-[#94A3B8]">
                    {item.charactersSanitized} chars
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
