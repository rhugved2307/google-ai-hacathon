import type { CSVScanResult, RedactionMode, ScanResult } from '../engine/types';

function triggerLocalBlobDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getBaseFilename(originalName?: string): string {
  if (!originalName) return 'veltrix-output';
  const dotIdx = originalName.lastIndexOf('.');
  const stem = dotIdx > 0 ? originalName.slice(0, dotIdx) : originalName;
  const safeStem = stem.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 60) || 'veltrix-output';
  return `${safeStem}-sanitized`;
}

export function downloadSanitizedTxt(sanitizedText: string, originalFilename?: string): void {
  const filename = `${getBaseFilename(originalFilename)}.txt`;
  triggerLocalBlobDownload(sanitizedText, filename, 'text/plain;charset=utf-8');
}

export function downloadSanitizedCsv(sanitizedCsv: string, originalFilename?: string): void {
  const filename = `${getBaseFilename(originalFilename)}.csv`;
  triggerLocalBlobDownload(sanitizedCsv, filename, 'text/csv;charset=utf-8');
}

/**
 * Generates and downloads a privacy-safe sanitization summary report.
 * Strictly excludes any original raw PII values.
 */
export function downloadSummaryReport(params: {
  sourceName: string;
  sourceType: 'text' | 'txt' | 'csv';
  redactionMode: RedactionMode;
  result: ScanResult;
  csvResult?: CSVScanResult | null;
}): void {
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
  triggerLocalBlobDownload(lines.join('\n'), filename, 'text/plain;charset=utf-8');
}
