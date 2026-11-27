import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { ConfidenceLevel, CustomRule } from '../../engine/types';
import { validateCustomRegexPattern } from '../../engine/validators';
import { isConfidenceLevel } from '../../utils/formatting';

interface CustomRulesTabProps {
  customRules: CustomRule[];
  onAddCustomRule: (rule: Omit<CustomRule, 'id'>) => void;
  onToggleCustomRule: (id: string) => void;
  onRemoveCustomRule: (id: string) => void;
}

export function CustomRulesTab({
  customRules,
  onAddCustomRule,
  onToggleCustomRule,
  onRemoveCustomRule,
}: CustomRulesTabProps) {
  const [ruleName, setRuleName] = useState('');
  const [rulePattern, setRulePattern] = useState('');
  const [ruleReplacement, setRuleReplacement] = useState('[CUSTOM REDACTED]');
  const [ruleCaseInsensitive, setRuleCaseInsensitive] = useState(true);
  const [ruleConfidence, setRuleConfidence] = useState<ConfidenceLevel>('medium');
  const [ruleError, setRuleError] = useState<string | null>(null);

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    setRuleError(null);

    const trimmedName = ruleName.trim();
    const trimmedPattern = rulePattern.trim();
    const trimmedReplacement = ruleReplacement.trim() || '[CUSTOM REDACTED]';

    if (!trimmedName) {
      setRuleError('Please enter a rule name.');
      return;
    }

    const flags = ruleCaseInsensitive ? 'gi' : 'g';
    const check = validateCustomRegexPattern(trimmedPattern, flags);
    if (!check.valid) {
      setRuleError(check.error);
      return;
    }

    onAddCustomRule({
      name: trimmedName,
      pattern: trimmedPattern,
      flags: check.safeFlags,
      replacement: trimmedReplacement,
      confidence: ruleConfidence,
      enabled: true,
    });
    setRuleName('');
    setRulePattern('');
    setRuleReplacement('[CUSTOM REDACTED]');
  };

  return (
    <div className="space-y-5">
      <form
        onSubmit={handleAddRule}
        className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-[#283449] dark:bg-[#0F1629]"
      >
        <h3 className="text-xs font-semibold text-slate-900 dark:text-[#F8FAFC]">
          Create Custom Regex Rule
        </h3>

        <label className="block space-y-1">
          <span className="text-[11px] font-medium text-slate-600 dark:text-[#94A3B8]">
            Rule Name
          </span>
          <input
            type="text"
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
            placeholder="e.g. Employee ID"
            className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-[#8B5CF6] focus:outline-none dark:border-[#283449] dark:bg-[#0B1020] dark:text-[#F8FAFC]"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-[11px] font-medium text-slate-600 dark:text-[#94A3B8]">
            Regex Pattern
          </span>
          <input
            type="text"
            value={rulePattern}
            onChange={(e) => setRulePattern(e.target.value)}
            placeholder="e.g. \bEMP-\d{5}\b"
            className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 font-mono text-xs text-slate-900 focus:border-[#8B5CF6] focus:outline-none dark:border-[#283449] dark:bg-[#0B1020] dark:text-[#F8FAFC]"
          />
        </label>

        <div className="grid grid-cols-2 gap-2.5">
          <label className="block space-y-1">
            <span className="text-[11px] font-medium text-slate-600 dark:text-[#94A3B8]">
              Replacement
            </span>
            <input
              type="text"
              value={ruleReplacement}
              onChange={(e) => setRuleReplacement(e.target.value)}
              placeholder="[EMP_ID]"
              className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 font-mono text-xs text-slate-900 focus:border-[#8B5CF6] focus:outline-none dark:border-[#283449] dark:bg-[#0B1020] dark:text-[#F8FAFC]"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-[11px] font-medium text-slate-600 dark:text-[#94A3B8]">
              Confidence
            </span>
            <select
              value={ruleConfidence}
              onChange={(e) => {
                if (isConfidenceLevel(e.target.value)) {
                  setRuleConfidence(e.target.value);
                }
              }}
              className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-900 focus:border-[#8B5CF6] focus:outline-none dark:border-[#283449] dark:bg-[#0B1020] dark:text-[#F8FAFC]"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
        </div>

        <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-[#94A3B8]">
          <input
            type="checkbox"
            checked={ruleCaseInsensitive}
            onChange={(e) => setRuleCaseInsensitive(e.target.checked)}
            className="h-3.5 w-3.5 rounded accent-[#8B5CF6]"
          />
          <span>Case-insensitive (i flag)</span>
        </label>

        {ruleError && (
          <p className="text-xs font-medium text-red-600 dark:text-[#F87171]" role="alert">
            {ruleError}
          </p>
        )}

        <button
          type="submit"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#8B5CF6] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[#7C3AED]"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Add Rule</span>
        </button>
      </form>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-900 dark:text-[#F8FAFC]">
          Configured Rules ({customRules.length})
        </h3>
        {customRules.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-500 dark:border-[#283449] dark:text-[#94A3B8]">
            No custom rules added yet.
          </p>
        ) : (
          customRules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 dark:border-[#283449] dark:bg-[#0F1629]"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-900 dark:text-[#F8FAFC]">
                  {rule.name}
                </p>
                <p className="truncate font-mono text-[11px] text-slate-500 dark:text-[#94A3B8]">
                  /{rule.pattern}/{rule.flags} →{' '}
                  <span className="text-emerald-700 dark:text-[#34D399]">{rule.replacement}</span>
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onToggleCustomRule(rule.id)}
                  className={`rounded-md px-2 py-1 text-[11px] font-medium ${
                    rule.enabled
                      ? 'bg-emerald-500/12 text-emerald-700 dark:text-[#34D399]'
                      : 'bg-slate-200 text-slate-600 dark:bg-[#1B2540] dark:text-[#94A3B8]'
                  }`}
                >
                  {rule.enabled ? 'On' : 'Off'}
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveCustomRule(rule.id)}
                  aria-label={`Delete ${rule.name}`}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-red-500/12 hover:text-red-600 dark:hover:text-[#F87171]"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
