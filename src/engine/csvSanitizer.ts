import { parseCSV, serializeCSV } from './csvParser';
import { scanAndSanitizeText } from './detector';
import { CATEGORY_META } from './patterns';
import type {
  CSVColumnSummary,
  CSVScanResult,
  CategoryStat,
  Detection,
  PIICategory,
  ScanOptions,
} from './types';

/**
 * Scans and sanitizes a CSV dataset cell-by-cell using column headers as contextual hints.
 * Preserves CSV structure, headers, rows, quoting, and line endings.
 */
export function scanAndSanitizeCSV(
  rawCSV: string,
  options: ScanOptions,
  selectedColumnIndices?: number[]
): CSVScanResult {
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const parsed = parseCSV(rawCSV);
  const totalColumns = parsed.headers.length;
  const totalRows = parsed.rows.length;

  const selectedSet = new Set<number>(
    selectedColumnIndices !== undefined
      ? selectedColumnIndices
      : parsed.headers.map((_, idx) => idx)
  );

  const columnCounts = new Array<number>(totalColumns).fill(0);
  const columnBreakdowns: Array<Partial<Record<PIICategory, number>>> = Array.from(
    { length: totalColumns },
    () => ({})
  );

  const sanitizedRows: string[][] = [];
  const allDetections: Detection[] = [];
  const aggregateCategoryCounts: Partial<Record<PIICategory, number>> = {};
  let totalCharactersSanitized = 0;
  let totalRedactions = 0;
  let detectionSeq = 0;

  for (let r = 0; r < totalRows; r++) {
    const row = parsed.rows[r];
    const nextRow: string[] = [];

    for (let c = 0; c < row.length; c++) {
      const cell = row[c] ?? '';
      const headerName = parsed.headers[c] ?? `Column ${c + 1}`;
      const isSelected = selectedSet.has(c);

      const cellScan = scanAndSanitizeText(cell, {
        ...options,
        contextHint: headerName,
      });

      if (cellScan.detections.length > 0 && c < totalColumns) {
        columnCounts[c] += cellScan.detections.length;
        for (const det of cellScan.detections) {
          columnBreakdowns[c][det.type] = (columnBreakdowns[c][det.type] ?? 0) + 1;
        }
      }

      if (isSelected) {
        nextRow.push(cellScan.sanitizedText);
        totalCharactersSanitized += cellScan.stats.charactersSanitized;
        totalRedactions += cellScan.stats.totalRedactions;

        for (const det of cellScan.detections) {
          detectionSeq += 1;
          aggregateCategoryCounts[det.type] = (aggregateCategoryCounts[det.type] ?? 0) + 1;
          allDetections.push({
            ...det,
            id: `csv-r${r + 2}-c${c + 1}-${detectionSeq}`,
            line: r + 2, // 1-indexed row accounting for header row
            column: c + 1,
            ruleName: `${det.ruleName} (${headerName})`,
          });
        }
      } else {
        // Excluded column: preserve original cell value
        nextRow.push(cell);
      }
    }

    sanitizedRows.push(nextRow);
  }

  const sanitizedCSV = serializeCSV(parsed, sanitizedRows);

  const columnSummaries: CSVColumnSummary[] = parsed.headers.map((name, index) => {
    const detectedCount = columnCounts[index] ?? 0;
    const selected = selectedSet.has(index);
    const status: CSVColumnSummary['status'] =
      detectedCount === 0 ? 'Clean' : selected ? 'Sanitized' : 'Excluded';

    return {
      index,
      name: name.trim() || `Column ${index + 1}`,
      detectedCount,
      categoryBreakdown: columnBreakdowns[index] ?? {},
      selected,
      status,
    };
  });

  const columnsWithPII = columnSummaries.filter((col) => col.detectedCount > 0).length;
  const totalDetections = allDetections.length;

  const categoryStats: CategoryStat[] = (
    Object.entries(aggregateCategoryCounts) as [PIICategory, number][]
  )
    .filter(([, count]) => count > 0)
    .map(([category, count]) => ({
      category,
      label: CATEGORY_META[category].label,
      count,
      percentage: totalDetections > 0 ? Math.round((count / totalDetections) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();

  return {
    parsed,
    sanitizedCSV,
    columnSummaries,
    totalRows,
    totalColumns,
    columnsWithPII,
    aggregateResult: {
      detections: allDetections,
      sanitizedText: sanitizedCSV,
      stats: {
        totalDetections,
        uniqueCategories: categoryStats.length,
        totalRedactions,
        charactersSanitized: totalCharactersSanitized,
        scanDurationMs: Math.max(0, Math.round((t1 - t0) * 10) / 10),
      },
      categoryStats,
    },
  };
}
