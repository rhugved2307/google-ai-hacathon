import { CATEGORY_LIST, CATEGORY_META } from '../../engine/patterns';
import type { PIICategory, RedactionMode } from '../../engine/types';

interface RedactionModeTabProps {
  redactionMode: RedactionMode;
  onChangeRedactionMode: (mode: RedactionMode) => void;
  customReplacements: Record<PIICategory, string>;
  onUpdateCustomReplacement: (category: PIICategory, value: string) => void;
}

const REDACTION_MODE_CARDS: ReadonlyArray<{
  readonly id: RedactionMode;
  readonly title: string;
  readonly description: string;
  readonly exampleBefore: string;
  readonly exampleAfter: string;
}> = [
  {
    id: 'full',
    title: 'Full Redaction',
    description: 'Replaces sensitive values completely with standardized category tags.',
    exampleBefore: 'rahul@gmail.com',
    exampleAfter: '[EMAIL]',
  },
  {
    id: 'partial',
    title: 'Partial Masking',
    description: 'Preserves minimal format hints while obscuring identifying characters.',
    exampleBefore: 'rahul@gmail.com',
    exampleAfter: 'r****@gmail.com',
  },
  {
    id: 'custom',
    title: 'Custom Replacement',
    description: 'Uses your custom replacement strings configured per PII category below.',
    exampleBefore: 'rahul@gmail.com',
    exampleAfter: '[PRIVATE EMAIL]',
  },
];

export function RedactionModeTab({
  redactionMode,
  onChangeRedactionMode,
  customReplacements,
  onUpdateCustomReplacement,
}: RedactionModeTabProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-2.5" role="radiogroup" aria-label="Redaction mode selection">
        {REDACTION_MODE_CARDS.map((card) => {
          const active = redactionMode === card.id;
          return (
            <button
              key={card.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChangeRedactionMode(card.id)}
              className={`block w-full rounded-xl border p-3.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] ${
                active
                  ? 'border-[#8B5CF6] bg-[#8B5CF6]/10 dark:border-[#A78BFA] dark:bg-[#1B2540]'
                  : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 dark:border-[#283449] dark:bg-[#0F1629] dark:hover:border-[#3A4B69]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-900 dark:text-[#F8FAFC]">
                  {card.title}
                </span>
                <span
                  className={`h-4 w-4 rounded-full border-2 ${
                    active
                      ? 'border-[#8B5CF6] bg-[#8B5CF6] ring-2 ring-[#8B5CF6]/30'
                      : 'border-slate-300 dark:border-[#475569]'
                  }`}
                  aria-hidden="true"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-[#94A3B8]">
                {card.description}
              </p>
              <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 font-mono text-[11px] ring-1 ring-slate-200/80 dark:bg-[#0B1020] dark:ring-[#283449]">
                <span className="text-slate-500 line-through dark:text-[#94A3B8]">
                  {card.exampleBefore}
                </span>
                <span className="text-slate-400">→</span>
                <span className="font-semibold text-emerald-700 dark:text-[#34D399]">
                  {card.exampleAfter}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom Replacement Strings */}
      <div className="space-y-2.5 border-t border-slate-200 pt-4 dark:border-[#283449]">
        <div>
          <h3 className="text-xs font-semibold text-slate-900 dark:text-[#F8FAFC]">
            Custom Replacement Labels
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
            Applied whenever Custom Replacement mode is active
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CATEGORY_LIST.map((cat) => {
            const meta = CATEGORY_META[cat];
            return (
              <label key={cat} className="block space-y-1">
                <span className="flex items-center gap-1.5 font-mono text-[11px] font-medium text-slate-600 dark:text-[#94A3B8]">
                  <span className={`h-2 w-2 rounded-xs ${meta.dotClass}`} />
                  <span>{meta.shortLabel}</span>
                </span>
                <input
                  type="text"
                  value={customReplacements[cat] ?? ''}
                  onChange={(e) => onUpdateCustomReplacement(cat, e.target.value)}
                  placeholder={meta.defaultCustomReplacement}
                  className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 font-mono text-xs text-slate-900 focus:border-[#8B5CF6] focus:outline-none dark:border-[#283449] dark:bg-[#0B1020] dark:text-[#F8FAFC]"
                />
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
