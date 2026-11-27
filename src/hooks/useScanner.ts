import { useCallback, useEffect, useRef, useState } from 'react';
import { scanAndSanitizeCSV } from '../engine/csvSanitizer';
import { DEMO_CSV_SAMPLE, DEMO_TEXT_SAMPLE } from '../engine/demoData';
import { scanAndSanitizeText } from '../engine/detector';
import type {
  CSVScanResult,
  PIICategory,
  RedactionMode,
  ScanOptions,
  ScanResult,
  SessionHistoryEntry,
  SourceType,
  UploadedFileInfo,
} from '../engine/types';
import { useRedactionSettings } from './useRedactionSettings';

interface UndoSnapshot {
  rawText: string;
  uploadedFile: UploadedFileInfo | null;
  isCSVMode: boolean;
  hasScanned: boolean;
  scanResult: ScanResult | null;
  csvResult: CSVScanResult | null;
  selectedCSVColumns: number[] | undefined;
}

export interface ExecuteScanParams {
  textOverride?: string;
  csvModeOverride?: boolean;
  fileOverride?: UploadedFileInfo | null;
  selectedColsOverride?: number[] | undefined;
  saveUndo?: boolean;
  logHistory?: boolean;
}

function buildScanSignature(
  text: string,
  csvMode: boolean,
  opts: ScanOptions,
  cols: number[] | undefined
): string {
  return JSON.stringify({
    len: text.length,
    head: text.slice(0, 64),
    tail: text.slice(-64),
    csvMode,
    mode: opts.redactionMode,
    customReplacements: opts.customReplacements,
    enabledCategories: opts.enabledCategories,
    customRules: opts.customRules,
    cols: cols ?? null,
  });
}

function isContentHeavilyModified(original: string, nextText: string): boolean {
  const lengthDelta = Math.abs(nextText.length - original.length);
  if (lengthDelta > Math.max(24, original.length * 0.2)) {
    return true;
  }

  const origLines = original
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (origLines.length === 0) return true;

  const nextLineSet = new Set(
    nextText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
  );
  const preservedCount = origLines.filter((l) => nextLineSet.has(l)).length;
  return preservedCount / origLines.length < 0.6;
}

export function useScanner() {
  const settings = useRedactionSettings();
  const { scanOptions } = settings;

  const [rawText, setRawText] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<UploadedFileInfo | null>(null);
  const [isCSVMode, setIsCSVMode] = useState<boolean>(false);

  const [liveScan, setLiveScan] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [hasScanned, setHasScanned] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [csvResult, setCsvResult] = useState<CSVScanResult | null>(null);
  const [selectedCSVColumns, setSelectedCSVColumns] = useState<number[] | undefined>(undefined);

  const [undoSnapshot, setUndoSnapshot] = useState<UndoSnapshot | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionHistoryEntry[]>([]);

  const debounceRef = useRef<number | null>(null);
  const scanFrameRef = useRef<number | null>(null);
  const lastScanSignatureRef = useRef<string>('');
  const loadedSourceContentRef = useRef<string | null>(null);

  // Clean up any pending timers on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
      if (scanFrameRef.current !== null) window.clearTimeout(scanFrameRef.current);
    };
  }, []);

  const captureUndoSnapshot = useCallback(() => {
    setUndoSnapshot({
      rawText,
      uploadedFile,
      isCSVMode,
      hasScanned,
      scanResult,
      csvResult,
      selectedCSVColumns,
    });
  }, [rawText, uploadedFile, isCSVMode, hasScanned, scanResult, csvResult, selectedCSVColumns]);

  const recordHistory = useCallback(
    (result: ScanResult, sourceName: string, sourceType: SourceType, mode: RedactionMode) => {
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

  const runLocalSanitization = useCallback(
    (
      text: string,
      csvMode: boolean,
      cols: number[] | undefined
    ): { result: ScanResult; effectiveCols: number[] | undefined } => {
      if (csvMode) {
        const csvOut = scanAndSanitizeCSV(text, scanOptions, cols);
        setCsvResult(csvOut);
        setScanResult(csvOut.aggregateResult);
        let effectiveCols = cols;
        if (cols === undefined) {
          effectiveCols = csvOut.columnSummaries.map((c) => c.index);
          setSelectedCSVColumns(effectiveCols);
        }
        return { result: csvOut.aggregateResult, effectiveCols };
      }

      const textOut = scanAndSanitizeText(text, scanOptions);
      setCsvResult(null);
      setScanResult(textOut);
      return { result: textOut, effectiveCols: cols };
    },
    [scanOptions]
  );

  const executeScan = useCallback(
    (params?: ExecuteScanParams): ScanResult | null => {
      const targetText = params?.textOverride !== undefined ? params.textOverride : rawText;
      const targetCsvMode =
        params?.csvModeOverride !== undefined ? params.csvModeOverride : isCSVMode;
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
        captureUndoSnapshot();
      }

      setIsScanning(true);

      try {
        const { result: finalResult, effectiveCols } = runLocalSanitization(
          targetText,
          targetCsvMode,
          targetCols
        );

        lastScanSignatureRef.current = buildScanSignature(
          targetText,
          targetCsvMode,
          scanOptions,
          effectiveCols
        );
        setHasScanned(true);

        if (params?.logHistory !== false) {
          const sourceName =
            targetFile?.name || (targetCsvMode ? 'Sample CSV Data' : 'Pasted Text');
          const sourceType: SourceType = targetFile?.type || (targetCsvMode ? 'csv' : 'text');
          recordHistory(finalResult, sourceName, sourceType, scanOptions.redactionMode);
        }

        if (scanFrameRef.current !== null) {
          window.clearTimeout(scanFrameRef.current);
        }
        scanFrameRef.current = window.setTimeout(() => setIsScanning(false), 120);
        return finalResult;
      } catch {
        setIsScanning(false);
        return null;
      }
    },
    [
      rawText,
      isCSVMode,
      uploadedFile,
      selectedCSVColumns,
      captureUndoSnapshot,
      runLocalSanitization,
      scanOptions,
      recordHistory,
    ]
  );

  // Immediately re-sanitize when redaction settings or CSV column selection change after scanning
  useEffect(() => {
    if (!hasScanned || !rawText.trim()) return;
    const nextSignature = buildScanSignature(rawText, isCSVMode, scanOptions, selectedCSVColumns);
    if (nextSignature === lastScanSignatureRef.current) return;

    const performRescan = () => {
      try {
        runLocalSanitization(rawText, isCSVMode, selectedCSVColumns);
        lastScanSignatureRef.current = nextSignature;
      } finally {
        setIsScanning(false);
      }
    };

    if (rawText.length >= 40_000) {
      setIsScanning(true);
      const timer = window.setTimeout(performRescan, 0);
      return () => window.clearTimeout(timer);
    }

    performRescan();
  }, [hasScanned, isCSVMode, rawText, scanOptions, selectedCSVColumns, runLocalSanitization]);

  // Debounced live scanning when enabled
  useEffect(() => {
    if (!liveScan) return;
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
    }
    if (!rawText.trim()) {
      setScanResult(null);
      setCsvResult(null);
      setHasScanned(false);
      lastScanSignatureRef.current = '';
      return;
    }

    const nextSignature = buildScanSignature(rawText, isCSVMode, scanOptions, selectedCSVColumns);
    if (hasScanned && nextSignature === lastScanSignatureRef.current) return;

    setIsScanning(true);
    debounceRef.current = window.setTimeout(() => {
      try {
        const { effectiveCols } = runLocalSanitization(rawText, isCSVMode, selectedCSVColumns);
        lastScanSignatureRef.current = buildScanSignature(
          rawText,
          isCSVMode,
          scanOptions,
          effectiveCols
        );
        setHasScanned(true);
      } finally {
        setIsScanning(false);
      }
    }, 260);

    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [
    liveScan,
    rawText,
    isCSVMode,
    scanOptions,
    selectedCSVColumns,
    hasScanned,
    runLocalSanitization,
  ]);

  const updateRawText = useCallback(
    (nextText: string) => {
      setRawText(nextText);

      if (!nextText.trim()) {
        setHasScanned(false);
        setScanResult(null);
        setCsvResult(null);
        setUploadedFile(null);
        setIsCSVMode(false);
        setSelectedCSVColumns(undefined);
        loadedSourceContentRef.current = null;
        lastScanSignatureRef.current = '';
        return;
      }

      if (
        uploadedFile &&
        loadedSourceContentRef.current !== null &&
        isContentHeavilyModified(loadedSourceContentRef.current, nextText)
      ) {
        setUploadedFile(null);
        loadedSourceContentRef.current = null;
        if (isCSVMode) {
          const firstLine = nextText.trimStart().split(/\r?\n/)[0] ?? '';
          if (!firstLine.includes(',')) {
            setIsCSVMode(false);
            setSelectedCSVColumns(undefined);
          }
        }
      }
    },
    [uploadedFile, isCSVMode]
  );

  const loadFile = useCallback(
    (content: string, info: UploadedFileInfo) => {
      captureUndoSnapshot();
      loadedSourceContentRef.current = content;
      setRawText(content);
      setUploadedFile(info);
      setIsCSVMode(info.type === 'csv');
      setSelectedCSVColumns(undefined);
      setHasScanned(false);
      setScanResult(null);
      setCsvResult(null);
    },
    [captureUndoSnapshot]
  );

  const removeFile = useCallback(() => {
    setUndoSnapshot(null);
    loadedSourceContentRef.current = null;
    lastScanSignatureRef.current = '';
    setUploadedFile(null);
    setRawText('');
    setIsCSVMode(false);
    setSelectedCSVColumns(undefined);
    setHasScanned(false);
    setScanResult(null);
    setCsvResult(null);
  }, []);

  const loadDemoText = useCallback(() => {
    captureUndoSnapshot();
    loadedSourceContentRef.current = null;
    setUploadedFile(null);
    setIsCSVMode(false);
    setSelectedCSVColumns(undefined);
    setRawText(DEMO_TEXT_SAMPLE);
    setHasScanned(false);
    setScanResult(null);
    setCsvResult(null);
  }, [captureUndoSnapshot]);

  const loadDemoCSV = useCallback(() => {
    captureUndoSnapshot();
    const fakeCsvInfo: UploadedFileInfo = {
      name: 'sample-customers-fictional.csv',
      size: new Blob([DEMO_CSV_SAMPLE]).size,
      type: 'csv',
      lastModified: Date.now(),
    };
    loadedSourceContentRef.current = DEMO_CSV_SAMPLE;
    setUploadedFile(fakeCsvInfo);
    setIsCSVMode(true);
    setSelectedCSVColumns(undefined);
    setRawText(DEMO_CSV_SAMPLE);
    setHasScanned(false);
    setScanResult(null);
    setCsvResult(null);
  }, [captureUndoSnapshot]);

  const clearAll = useCallback(() => {
    // Wipe all sensitive in-memory workspace state, including undo snapshots and session history
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    if (scanFrameRef.current !== null) window.clearTimeout(scanFrameRef.current);
    loadedSourceContentRef.current = null;
    lastScanSignatureRef.current = '';
    setUndoSnapshot(null);
    setSessionHistory([]);
    setRawText('');
    setUploadedFile(null);
    setIsCSVMode(false);
    setSelectedCSVColumns(undefined);
    setHasScanned(false);
    setIsScanning(false);
    setScanResult(null);
    setCsvResult(null);
  }, []);

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
    ...settings,
    rawText,
    updateRawText,
    uploadedFile,
    isCSVMode,
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
    toggleCSVColumn,
    sanitizeAllCSVColumns,
    excludeAllCSVColumns,
    selectOnlyPIICSVColumns,
    sessionHistory,
    clearSessionHistory,
  };
}
