import { CATEGORY_LIST, CATEGORY_META } from '../../engine/patterns';
import type { PIICategory } from '../../engine/types';

interface DetectorsTabProps {
  enabledCategories: Record<PIICategory, boolean>;
  onToggleCategory: (category: PIICategory) => void;
  onSetAllCategories: (enabled: boolean) => void;
}

export function DetectorsTab({
  enabledCategories,
  onToggleCategory,
  onSetAllCategories,
}: DetectorsTabProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-[#94A3B8]">Toggle individual PII categories</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSetAllCategories(true)}
            className="font-semibold text-[#7C3AED] hover:underline dark:text-[#A78BFA]"
          >
            Enable all
          </button>
          <span className="text-slate-300 dark:text-[#283449]">·</span>
          <button
            type="button"
            onClick={() => onSetAllCategories(false)}
            className="font-medium text-slate-500 hover:underline dark:text-[#94A3B8]"
          >
            Disable all
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {CATEGORY_LIST.map((cat) => {
          const meta = CATEGORY_META[cat];
          const enabled = enabledCategories[cat];
          return (
            <div
              key={cat}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 dark:border-[#283449] dark:bg-[#0F1629]"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-xs ${meta.dotClass}`} />
                  <span className="font-mono text-xs font-semibold text-slate-900 dark:text-[#F8FAFC]">
                    {meta.shortLabel}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-[#94A3B8]">{meta.label}</span>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-[#94A3B8]">
                  {meta.description}
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                aria-label={`Toggle ${meta.label}`}
                onClick={() => onToggleCategory(cat)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] ${
                  enabled ? 'bg-[#8B5CF6]' : 'bg-slate-300 dark:bg-[#283449]'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    enabled ? 'translate-x-4.5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
