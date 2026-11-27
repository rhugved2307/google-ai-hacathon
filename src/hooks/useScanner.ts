import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { scanAndSanitizeCSV } from '../engine/csvSanitizer';
import { DEMO_CSV_SAMPLE, DEMO_TEXT_SAMPLE } from '../engine/demoData';
import { scanAndSanitizeText } from '../engine/detector';
import {
  getDefaultCustomReplacements,
  getDefaultEnabledCategories,
} from '../engine/patterns';
import type {
  CSVScanResult,
  CustomRule,
  PIICategory,
  RedactionMode,
  ScanOptions,
  ScanResult,
  SessionHistoryEntry,
  UploadedFileInfo,
} from '../engine/types';

interface UndoSnapshot {
  rawText: string;
  uploadedFile: UploadedFileInfo | null;
  isCSVMode: boolean;
  hasScanned: boolean;
  scanResult: ScanResult | null;
  csvResult: CSVScanResult | null;
  selectedCSVColumns: number[] | undefined;
}

export function useScanner() {
  const [rawText, setRawText] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<UploadedFileInfo | null>(null);
  const [isCSVMode, setIsCSVMode] = useState<boolean>(false);

  const [redactionMode, setRedactionMode] = useState<RedactionMode>('full');
  const [customReplacements, setCustomReplacements] = useState<Record<PIICategory, string>>(
    () => getDefaultCustomReplacements()
  );
  const [enabledCategories, setEnabledCategories] = useState<Record<PIICategory, boolean>>(
    () => getDefaultEnabledCategories()
  );
  const [customRules, setCustomRules] = useState<CustomRule[]>([]);

  const [liveScan, setLiveScan] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [hasScanned, setHasScanned] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [csvResult, setCsvResult] = useState<CSVScanResult | null>(null);
  const [selectedCSVColumns, setSelectedCSVColumns] = useState<number[] | undefined>(undefined);

  const [undoSnapshot, setUndoSnapshot] = useState<UndoSnapshot | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionHistoryEntry[]>([]);

  const debounceRef = useRef<number | null>(null);

  const scanOptions: ScanOptions = useMemo(
    () => ({
      redactionMode,
      customReplacements,
      enabledCategories,
      customRules,
    }),
    [redactionMode, customReplacements, enabledCategories, customRules]
  );

  const recordHistory = useCallback(
    (
      result: ScanResult,
      sourceName: string,
      sourceType: 'text' | 'txt' | 'csv',
      mode: RedactionMode
    ) => {
      const categoryCounts: Partial<Record<PIICategory, number>> = {};
      for (const stat of result.categoryStats) {
        categoryCounts[stat.category] = stat.count;
      }
      const entry: SessionHistoryEntry = {
        id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        sourceName,
        sourceType,
        redactionMode: mode,
        totalDetections: result.stats.totalDetections,
        uniqueCategories: result.stats.uniqueCategories,
        charactersSanitized: result.stats.charactersSanitized,
        categoryCounts,
      };
      setSessionHistory((prev) => [entry, ...prev].slice(0, 15));
    },
    []
  );

  const executeScan = useCallback(
    (params?: {
      textOverride?: string;
      csvModeOverride?: boolean;
      fileOverride?: UploadedFileInfo | null;
      selectedColsOverride?: number[] | undefined;
      saveUndo?: boolean;
      logHistory?: boolean;
    }) => {
      const targetText = params?.textOverride !== undefined ? params.textOverride : rawText;
      const targetCsvMode = params?.csvModeOverride !== undefined ? params.csvModeOverride : isCSVMode;
      const targetFile = params?.fileOverride !== undefined ? params.fileOverride : uploadedFile;
      const targetCols =
        params && 'selectedColsOverride' in params
          ? params.selectedColsOverride
          : selectedCSVColumns;

      if (!targetText.trim()) {
        setScanResult(null);
        setCsvResult(null);
        setHasScanned(false);
        return null;
      }

      if (params?.saveUndo !== false) {
        setUndoSnapshot({
          rawText,
          uploadedFile,
          isCSVMode,
          hasScanned,
          scanResult,
          csvResult,
          selectedCSVColumns,
        });
      }

      setIsScanning(true);

      let finalResult: ScanResult;
      if (targetCsvMode) {
        const csvOut = scanAndSanitizeCSV(targetText, scanOptions, targetCols);
        setCsvResult(csvOut);
        setScanResult(csvOut.aggregateResult);
        if (targetCols === undefined) {
          setSelectedCSVColumns(csvOut.columnSummaries.map((c) => c.index));
        }
        finalResult = csvOut.aggregateResult;
      } else {
        const textOut = scanAndSanitizeText(targetText, scanOptions);
        setCsvResult(null);
        setScanResult(textOut);
        finalResult = textOut;
      }

      setHasScanned(true);

      if (params?.logHistory !== false) {
        const sourceName = targetFile?.name || (targetCsvMode ? 'Sample CSV Data' : 'Pasted Text');
        const sourceType = targetFile?.type || (targetCsvMode ? 'csv' : 'text');
        recordHistory(finalResult, sourceName, sourceType, scanOptions.redactionMode);
      }

      window.setTimeout(() => setIsScanning(false), 120);
      return finalResult;
    },
    [
      rawText,
      isCSVMode,
      uploadedFile,
      selectedCSVColumns,
      hasScanned,
      scanResult,
      csvResult,
      scanOptions,
      recordHistory,
    ]
  );

  // Immediately re-sanitize when redaction mode, custom replacements, enabled categories, custom rules, or CSV columns change after scanning
  useEffect(() => {
    if (!hasScanned || !rawText.trim()) return;
    if (isCSVMode) {
      const csvOut = scanAndSanitizeCSV(rawText, scanOptions, selectedCSVColumns);
      setCsvResult(csvOut);
      setScanResult(csvOut.aggregateResult);
    } else {
      const textOut = scanAndSanitizeText(rawText, scanOptions);
      setCsvResult(null);
      setScanResult(textOut);
    }
  }, [
    hasScanned,
    isCSVMode,
    rawText,
    scanOptions,
    selectedCSVColumns,
  ]);

  // Debounced live scanning when enabled
  useEffect(() => {
    if (!liveScan) return;
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    if (!rawText.trim()) {
      setScanResult(null);
      setCsvResult(null);
      setHasScanned(false);
      return;
    }
    setIsScanning(true);
    debounceRef.current = window.setTimeout(() => {
      if (isCSVMode) {
        const csvOut = scanAndSanitizeCSV(rawText, scanOptions, selectedCSVColumns);
        setCsvResult(csvOut);
        setScanResult(csvOut.aggregateResult);
        if (selectedCSVColumns === undefined) {
          setSelectedCSVColumns(csvOut.columnSummaries.map((c) => c.index));
        }
      } else {
        const textOut = scanAndSanitizeText(rawText, scanOptions);
        setCsvResult(null);
        setScanResult(textOut);
      }
      setHasScanned(true);
      setIsScanning(false);
    }, 260);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [liveScan, rawText, isCSVMode, scanOptions, selectedCSVColumns]);

  const updateRawText = useCallback(
    (nextText: string) => {
      setRawText(nextText);
      if (!nextText.trim()) {
        setHasScanned(false);
        setScanResult(null);
        setCsvResult(null);
      }
    },
    []
  );

  const loadFile = useCallback(
    (content: string, info: UploadedFileInfo) => {
      setUndoSnapshot({
        rawText,
        uploadedFile,
        isCSVMode,
        hasScanned,
        scanResult,
        csvResult,
        selectedCSVColumns,
      });
      setRawText(content);
      setUploadedFile(info);
      const csvFlag = info.type === 'csv';
      setIsCSVMode(csvFlag);
      setSelectedCSVColumns(undefined);
      setHasScanned(false);
      setScanResult(null);
      setCsvResult(null);

      // If live scan is enabled, it will auto-run via effect
    },
    [rawText, uploadedFile, isCSVMode, hasScanned, scanResult, csvResult, selectedCSVColumns]
  );

  const removeFile = useCallback(() => {
    setUndoSnapshot({
      rawText,
      uploadedFile,
      isCSVMode,
      hasScanned,
      scanResult,
      csvResult,
      selectedCSVColumns,
    });
    setUploadedFile(null);
    setRawText('');
    setIsCSVMode(false);
    setSelectedCSVColumns(undefined);
    setHasScanned(false);
    setScanResult(null);
    setCsvResult(null);
  }, [rawText, uploadedFile, isCSVMode, hasScanned, scanResult, csvResult, selectedCSVColumns]);

  const loadDemoText = useCallback(() => {
    setUndoSnapshot({
      rawText,
      uploadedFile,
      isCSVMode,
      hasScanned,
      scanResult,
      csvResult,
      selectedCSVColumns,
    });
    setUploadedFile(null);
    setIsCSVMode(false);
    setSelectedCSVColumns(undefined);
    setRawText(DEMO_TEXT_SAMPLE);
    setHasScanned(false);
    setScanResult(null);
    setCsvResult(null);
  }, [rawText, uploadedFile, isCSVMode, hasScanned, scanResult, csvResult, selectedCSVColumns]);

  const loadDemoCSV = useCallback(() => {
    setUndoSnapshot({
      rawText,
      uploadedFile,
      isCSVMode,
      hasScanned,
      scanResult,
      csvResult,
      selectedCSVColumns,
    });
    const fakeCsvInfo: UploadedFileInfo = {
      name: 'sample-customers-fictional.csv',
      size: new Blob([DEMO_CSV_SAMPLE]).size,
      type: 'csv',
      lastModified: Date.now(),
    };
    setUploadedFile(fakeCsvInfo);
    setIsCSVMode(true);
    setSelectedCSVColumns(undefined);
    setRawText(DEMO_CSV_SAMPLE);
    setHasScanned(false);
    setScanResult(null);
    setCsvResult(null);
  }, [rawText, uploadedFile, isCSVMode, hasScanned, scanResult, csvResult, selectedCSVColumns]);

  const clearAll = useCallback(() => {
    setUndoSnapshot({
      rawText,
      uploadedFile,
      isCSVMode,
      hasScanned,
      scanResult,
      csvResult,
      selectedCSVColumns,
    });
    setRawText('');
    setUploadedFile(null);
    setIsCSVMode(false);
    setSelectedCSVColumns(undefined);
    setHasScanned(false);
    setScanResult(null);
    setCsvResult(null);
  }, [rawText, uploadedFile, isCSVMode, hasScanned, scanResult, csvResult, selectedCSVColumns]);

  const undoLastAction = useCallback(() => {
    if (!undoSnapshot) return false;
    setRawText(undoSnapshot.rawText);
    setUploadedFile(undoSnapshot.uploadedFile);
    setIsCSVMode(undoSnapshot.isCSVMode);
    setHasScanned(undoSnapshot.hasScanned);
    setScanResult(undoSnapshot.scanResult);
    setCsvResult(undoSnapshot.csvResult);
    setSelectedCSVColumns(undoSnapshot.selectedCSVColumns);
    setUndoSnapshot(null);
    return true;
  }, [undoSnapshot]);

  const updateCustomReplacement = useCallback((category: PIICategory, value: string) => {
    setCustomReplacements((prev) => ({ ...prev, [category]: value }));
  }, []);

  const toggleCategoryEnabled = useCallback((category: PIICategory) => {
    setEnabledCategories((prev) => ({ ...prev, [category]: !prev[category] }));
  }, []);

  const setAllCategoriesEnabled = useCallback((enabled: boolean) => {
    setEnabledCategories((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next) as PIICategory[]) {
        next[key] = enabled;
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

  const toggleCSVColumn = useCallback(
    (colIndex: number) => {
      if (!csvResult) return;
      const current = new Set(
        selectedCSVColumns ?? csvResult.columnSummaries.map((c) => c.index)
      );
      if (current.has(colIndex)) {
        current.delete(colIndex);
      } else {
        current.add(colIndex);
      }
      setSelectedCSVColumns(Array.from(current).sort((a, b) => a - b));
    },
    [csvResult, selectedCSVColumns]
  );

  const sanitizeAllCSVColumns = useCallback(() => {
    if (!csvResult) return;
    setSelectedCSVColumns(csvResult.columnSummaries.map((c) => c.index));
  }, [csvResult]);

  const excludeAllCSVColumns = useCallback(() => {
    setSelectedCSVColumns([]);
  }, []);

  const selectOnlyPIICSVColumns = useCallback(() => {
    if (!csvResult) return;
    setSelectedCSVColumns(
      csvResult.columnSummaries.filter((c) => c.detectedCount > 0).map((c) => c.index)
    );
  }, [csvResult]);

  const clearSessionHistory = useCallback(() => {
    setSessionHistory([]);
  }, []);

  return {
    rawText,
    updateRawText,
    uploadedFile,
    isCSVMode,
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
    liveScan,
    setLiveScan,
    isScanning,
    hasScanned,
    scanResult,
    csvResult,
    selectedCSVColumns,
    executeScan,
    loadFile,
    removeFile,
    loadDemoText,
    loadDemoCSV,
    clearAll,
    canUndo: undoSnapshot !== null,
    undoLastAction,
    resetSettings,
    toggleCSVColumn,
    sanitizeAllCSVColumns,
    excludeAllCSVColumns,
    selectOnlyPIICSVColumns,
    sessionHistory,
    clearSessionHistory,
  };
}
