import { useCallback, useMemo, useState } from 'react';
import {
  CATEGORY_LIST,
  getDefaultCustomReplacements,
  getDefaultEnabledCategories,
} from '../engine/patterns';
import type { CustomRule, PIICategory, RedactionMode, ScanOptions } from '../engine/types';

export function useRedactionSettings() {
  const [redactionMode, setRedactionMode] = useState<RedactionMode>('full');
  const [customReplacements, setCustomReplacements] = useState<Record<PIICategory, string>>(
    () => getDefaultCustomReplacements()
  );
  const [enabledCategories, setEnabledCategories] = useState<Record<PIICategory, boolean>>(
    () => getDefaultEnabledCategories()
  );
  const [customRules, setCustomRules] = useState<CustomRule[]>([]);

  const scanOptions: ScanOptions = useMemo(
    () => ({
      redactionMode,
      customReplacements,
      enabledCategories,
      customRules,
    }),
    [redactionMode, customReplacements, enabledCategories, customRules]
  );

  const updateCustomReplacement = useCallback((category: PIICategory, value: string) => {
    setCustomReplacements((prev) => ({ ...prev, [category]: value }));
  }, []);

  const toggleCategoryEnabled = useCallback((category: PIICategory) => {
    setEnabledCategories((prev) => ({ ...prev, [category]: !prev[category] }));
  }, []);

  const setAllCategoriesEnabled = useCallback((enabled: boolean) => {
    setEnabledCategories(() => {
      const next = {} as Record<PIICategory, boolean>;
      for (const cat of CATEGORY_LIST) {
        next[cat] = enabled;
      }
      return next;
    });
  }, []);

  const addCustomRule = useCallback((rule: Omit<CustomRule, 'id'>) => {
    const newRule: CustomRule = {
      ...rule,
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setCustomRules((prev) => [...prev, newRule]);
  }, []);

  const toggleCustomRule = useCallback((id: string) => {
    setCustomRules((prev) =>
      prev.map((rule) => (rule.id === id ? { ...rule, enabled: !rule.enabled } : rule))
    );
  }, []);

  const removeCustomRule = useCallback((id: string) => {
    setCustomRules((prev) => prev.filter((rule) => rule.id !== id));
  }, []);

  const resetSettings = useCallback(() => {
    setRedactionMode('full');
    setCustomReplacements(getDefaultCustomReplacements());
    setEnabledCategories(getDefaultEnabledCategories());
    setCustomRules([]);
  }, []);

  return {
    redactionMode,
    setRedactionMode,
    customReplacements,
    updateCustomReplacement,
    enabledCategories,
    toggleCategoryEnabled,
    setAllCategoriesEnabled,
    customRules,
    addCustomRule,
    toggleCustomRule,
    removeCustomRule,
    resetSettings,
    scanOptions,
  };
}
