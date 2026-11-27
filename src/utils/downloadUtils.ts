import type {
  CSVScanResult,
  ExportResult,
  RedactionMode,
  ScanResult,
  SourceType,
} from '../engine/types';

export type { ExportResult };

function triggerLocalBlobDownload(
  content: string,
  filename: string,
  mimeType: string
): ExportResult {
  if (typeof document === 'undefined' || typeof URL === 'undefined' || !document.body) {
    return { success: false, error: 'File download is unavailable in this environment.' };
  }

  let url: string | null = null;
  let anchor: HTMLAnchorElement | null = null;

  try {
    const blob = new Blob([content], { type: mimeType });
    url = URL.createObjectURL(blob);
    anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    return { success: true, filename };
  } catch {
    return {
      success: false,
      error: 'Unable to export file locally. Check browser download permissions.',
    };
  } finally {
    if (anchor && anchor.parentNode) {
      anchor.parentNode.removeChild(anchor);
    }
    if (url) {
      const objectUrl = url;
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    }
  }
}

export function getBaseFilename(originalName?: string): string {
  if (!originalName) return 'sanitized-custom-input';
  const dotIdx = originalName.lastIndexOf('.');
  const stem = dotIdx > 0 ? originalName.slice(0, dotIdx) : originalName;
  const safeStem = stem.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 60) || 'custom-input';
  return `sanitized-${safeStem}`;
}

export function downloadSanitizedTxt(
  sanitizedText: string,
  originalFilename?: string
): ExportResult {
  if (!sanitizedText) {
    return { success: false, error: 'There is no sanitized text to export.' };
  }
  const filename = `${getBaseFilename(originalFilename)}.txt`;
  return triggerLocalBlobDownload(sanitizedText, filename, 'text/plain;charset=utf-8');
}

export function downloadSanitizedCsv(
  sanitizedCsv: string,
  originalFilename?: string
): ExportResult {
  if (!sanitizedCsv) {
    return { success: false, error: 'There is no sanitized CSV content to export.' };
  }
  const filename = `${getBaseFilename(originalFilename)}.csv`;
  return triggerLocalBlobDownload(sanitizedCsv, filename, 'text/csv;charset=utf-8');
}

export interface SummaryReportParams {
  sourceName: string;
  sourceType: SourceType;
  redactionMode: RedactionMode;
  result: ScanResult;
  csvResult?: CSVScanResult | null;
}

/**
 * Generates and downloads a privacy-safe sanitization summary report.
 * Strictly excludes any original raw PII values.
 */
export function downloadSummaryReport(params: SummaryReportParams): ExportResult {
  const { sourceName, sourceType, redactionMode, result, csvResult } = params;
  const generatedAt = new Date().toISOString();

  const lines: string[] = [
    '============================================================',
    'VELTRIX — LOCAL SANITIZATION SUMMARY REPORT',
    '============================================================',
    `Generated At      : ${generatedAt}`,
    `Source            : ${sourceName}`,
    `Input Type        : ${sourceType.toUpperCase()}`,
    `Redaction Mode    : ${redactionMode.toUpperCase()}`,
    'Processing Method : 100% Browser-Only (Local Device)',
    'Privacy Guarantee : Zero original PII values included in this report',
    '',
    '--- SUMMARY METRICS ---',
    `Total Detections      : ${result.stats.totalDetections}`,
    `Unique Categories     : ${result.stats.uniqueCategories}`,
    `Total Redactions      : ${result.stats.totalRedactions}`,
    `Characters Sanitized  : ${result.stats.charactersSanitized}`,
    `Scan Time             : ${result.stats.scanDurationMs} ms`,
    '',
    '--- CATEGORY BREAKDOWN ---',
  ];

  if (result.categoryStats.length === 0) {
    lines.push('No sensitive patterns detected.');
  } else {
    for (const stat of result.categoryStats) {
      lines.push(
        `${stat.category.padEnd(15)} : ${String(stat.count).padStart(5)} detected (${stat.percentage.toFixed(1)}%)`
      );
    }
  }

  if (csvResult) {
    lines.push(
      '',
      '--- CSV COLUMN ANALYSIS ---',
      `Total Rows        : ${csvResult.totalRows}`,
      `Total Columns     : ${csvResult.totalColumns}`,
      `Columns With PII  : ${csvResult.columnsWithPII}`,
      ''
    );
    for (const col of csvResult.columnSummaries) {
      lines.push(
        `Col ${String(col.index + 1).padStart(2)} (${col.name}) : ${col.detectedCount} detected | Status: ${col.status}`
      );
    }
  }

  lines.push(
    '',
    '--- IMPORTANT NOTICE ---',
    'Automated pattern and heuristic detection may miss context-specific',
    'or non-standard sensitive data. Always review sanitized output before sharing.',
    '============================================================'
  );

  const filename = `${getBaseFilename(sourceName)}-report.txt`;
  return triggerLocalBlobDownload(lines.join('\n'), filename, 'text/plain;charset=utf-8');
}
