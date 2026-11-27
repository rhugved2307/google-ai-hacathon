import {
  History,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import type {
  CustomRule,
  PIICategory,
  RedactionMode,
  SessionHistoryEntry,
} from '../engine/types';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';
import { CustomRulesTab } from './settings/CustomRulesTab';
import { DetectorsTab } from './settings/DetectorsTab';
import { RedactionModeTab } from './settings/RedactionModeTab';
import { SessionHistoryTab } from './settings/SessionHistoryTab';

export type DrawerTab = 'mode' | 'detectors' | 'rules' | 'session';

export interface SettingsDrawerProps {
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

const DRAWER_TABS: ReadonlyArray<{
  readonly id: DrawerTab;
  readonly label: string;
  readonly icon: typeof SlidersHorizontal;
}> = [
  { id: 'mode', label: 'Modes', icon: SlidersHorizontal },
  { id: 'detectors', label: 'Detectors', icon: ShieldCheck },
  { id: 'rules', label: 'Custom Rules', icon: Sparkles },
  { id: 'session', label: 'Session', icon: History },
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
  const drawerPanelRef = useRef<HTMLDivElement | null>(null);

  useDialogAccessibility(open, drawerPanelRef, onClose);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/65 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-drawer-title"
      onClick={onClose}
    >
      <div
        ref={drawerPanelRef}
        className="flex h-full w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-white/[0.08] dark:bg-[#131318]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-white/[0.08]">
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
            {DRAWER_TABS.map((tab) => {
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
          {activeTab === 'mode' && (
            <RedactionModeTab
              redactionMode={redactionMode}
              onChangeRedactionMode={onChangeRedactionMode}
              customReplacements={customReplacements}
              onUpdateCustomReplacement={onUpdateCustomReplacement}
            />
          )}

          {activeTab === 'detectors' && (
            <DetectorsTab
              enabledCategories={enabledCategories}
              onToggleCategory={onToggleCategory}
              onSetAllCategories={onSetAllCategories}
            />
          )}

          {activeTab === 'rules' && (
            <CustomRulesTab
              customRules={customRules}
              onAddCustomRule={onAddCustomRule}
              onToggleCustomRule={onToggleCustomRule}
              onRemoveCustomRule={onRemoveCustomRule}
            />
          )}

          {activeTab === 'session' && (
            <SessionHistoryTab
              sessionHistory={sessionHistory}
              onClearHistory={onClearHistory}
            />
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
