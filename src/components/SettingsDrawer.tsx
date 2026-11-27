import {
  CheckCircle2,
  History,
  Plus,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { CATEGORY_LIST, CATEGORY_META } from '../engine/patterns';
import type {
  ConfidenceLevel,
  CustomRule,
  PIICategory,
  RedactionMode,
  SessionHistoryEntry,
} from '../engine/types';

export type DrawerTab = 'mode' | 'detectors' | 'rules' | 'session';

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  redactionMode: RedactionMode;
  onChangeRedactionMode: (mode: RedactionMode) => void;
  enabledCategories: Record<PIICategory, boolean>;
  onToggleCategory: (category: PIICategory) => void;
  onSetAllCategories: (enabled: boolean) => void;
  customReplacements: Record<PIICategory, string>;
  onUpdateCustomReplacement: (category: PIICategory, value: string) => void;
  customRules: CustomRule[];
  onAddCustomRule: (rule: Omit<CustomRule, 'id'>) => void;
  onToggleCustomRule: (id: string) => void;
  onRemoveCustomRule: (id: string) => void;
  onResetSettings: () => void;
  sessionHistory: SessionHistoryEntry[];
  onClearHistory: () => void;
}

const REDACTION_MODE_CARDS: Array<{
  id: RedactionMode;
  title: string;
  description: string;
  exampleBefore: string;
  exampleAfter: string;
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

export function SettingsDrawer({
  open,
  onClose,
  redactionMode,
  onChangeRedactionMode,
  enabledCategories,
  onToggleCategory,
  onSetAllCategories,
  customReplacements,
  onUpdateCustomReplacement,
  customRules,
  onAddCustomRule,
  onToggleCustomRule,
  onRemoveCustomRule,
  onResetSettings,
  sessionHistory,
  onClearHistory,
}: SettingsDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>('mode');
  const [ruleName, setRuleName] = useState('');
  const [rulePattern, setRulePattern] = useState('');
  const [ruleReplacement, setRuleReplacement] = useState('[CUSTOM REDACTED]');
  const [ruleCaseInsensitive, setRuleCaseInsensitive] = useState(true);
  const [ruleConfidence, setRuleConfidence] = useState<ConfidenceLevel>('medium');
  const [ruleError, setRuleError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const localStorageCount = typeof window !== 'undefined' ? window.localStorage.length : 0;
  const sessionStorageCount = typeof window !== 'undefined' ? window.sessionStorage.length : 0;

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
    if (!trimmedPattern) {
      setRuleError('Please enter a regular expression pattern.');
      return;
    }

    try {
      const flags = ruleCaseInsensitive ? 'gi' : 'g';
      new RegExp(trimmedPattern, flags);
      onAddCustomRule({
        name: trimmedName,
        pattern: trimmedPattern,
        flags,
        replacement: trimmedReplacement,
        confidence: ruleConfidence,
        enabled: true,
      });
      setRuleName('');
      setRulePattern('');
      setRuleReplacement('[CUSTOM REDACTED]');
    } catch (err) {
      setRuleError(
        err instanceof Error ? `Invalid regex: ${err.message}` : 'Invalid regular expression.'
      );
    }
  };

  const tabs: Array<{ id: DrawerTab; label: string; icon: typeof SlidersHorizontal }> = [
    { id: 'mode', label: 'Modes', icon: SlidersHorizontal },
    { id: 'detectors', label: 'Detectors', icon: ShieldCheck },
    { id: 'rules', label: 'Custom Rules', icon: Sparkles },
    { id: 'session', label: 'Session', icon: History },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/65 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-drawer-title"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-[#283449] dark:bg-[#141B2D]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-[#283449]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8B5CF6]/15 text-[#7C3AED] dark:text-[#A78BFA]">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h2
                id="settings-drawer-title"
                className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]"
              >
                Redaction Settings
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
                Changes update sanitized output immediately
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close redaction settings drawer"
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-[#1B2540] dark:hover:text-[#F8FAFC]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Drawer Tab Switcher */}
        <div className="border-b border-slate-200 px-5 py-2.5 dark:border-[#283449]">
          <div
            role="tablist"
            className="grid grid-cols-4 gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-[#283449] dark:bg-[#0B1020]"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-[#1B2540] dark:text-[#F8FAFC]'
                      : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 hidden sm:block" aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* TAB 1: Redaction Modes + Custom Labels */}
          {activeTab === 'mode' && (
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
          )}

          {/* TAB 2: Enable / Disable Detectors */}
          {activeTab === 'detectors' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-[#94A3B8]">
                  Toggle individual PII categories
                </span>
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
                          <span className="text-xs text-slate-500 dark:text-[#94A3B8]">
                            {meta.label}
                          </span>
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
          )}

          {/* TAB 3: Custom Regex Rules */}
          {activeTab === 'rules' && (
            <div className="space-y-5">
              <form onSubmit={handleAddRule} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-[#283449] dark:bg-[#0F1629]">
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
                      onChange={(e) => setRuleConfidence(e.target.value as ConfidenceLevel)}
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
                          <span className="text-emerald-700 dark:text-[#34D399]">
                            {rule.replacement}
                          </span>
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
          )}

          {/* TAB 4: Session History & Privacy Check */}
          {activeTab === 'session' && (
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
          )}
        </div>

        {/* Drawer Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3.5 dark:border-[#283449]">
          <button
            type="button"
            onClick={onResetSettings}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-red-400/50 hover:text-red-600 dark:border-[#283449] dark:text-[#94A3B8] dark:hover:text-[#F87171]"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-xl bg-[#8B5CF6] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#7C3AED]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
