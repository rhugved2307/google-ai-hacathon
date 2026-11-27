import { parseCSV, serializeCSV } from './csvParser';
import { scanAndSanitizeText } from './detector';
import { buildCategoryStats } from './stats';
import type {
  CSVColumnSummary,
  CSVScanResult,
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
  const maxRowWidth = parsed.rows.reduce((max, r) => Math.max(max, r.length), parsed.headers.length);
  const effectiveHeaders =
    maxRowWidth > parsed.headers.length
      ? [
          ...parsed.headers,
          ...Array.from(
            { length: maxRowWidth - parsed.headers.length },
            (_, idx) => `Column ${parsed.headers.length + idx + 1}`
          ),
        ]
      : parsed.headers;
  const normalizedParsed =
    effectiveHeaders === parsed.headers
      ? parsed
      : {
          ...parsed,
          headers: effectiveHeaders,
          rows: parsed.rows.map((r) =>
            r.length < maxRowWidth
              ? [...r, ...Array<string>(maxRowWidth - r.length).fill('')]
              : r
          ),
        };

  const totalColumns = normalizedParsed.headers.length;
  const totalRows = normalizedParsed.rows.length;

  const selectedSet = new Set<number>(
    selectedColumnIndices !== undefined
      ? selectedColumnIndices
      : normalizedParsed.headers.map((_, idx) => idx)
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
    const row = normalizedParsed.rows[r] ?? [];
    const nextRow: string[] = [];

    for (let c = 0; c < totalColumns; c++) {
      const cell = row[c] ?? '';
      const headerName = normalizedParsed.headers[c] ?? `Column ${c + 1}`;
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

  const sanitizedCSV = serializeCSV(normalizedParsed, sanitizedRows, { neutralizeFormulas: true });

  const columnSummaries: CSVColumnSummary[] = normalizedParsed.headers.map((name, index) => {
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
  const categoryStats = buildCategoryStats(aggregateCategoryCounts, totalDetections);

  const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();

  return {
    parsed: normalizedParsed,
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
