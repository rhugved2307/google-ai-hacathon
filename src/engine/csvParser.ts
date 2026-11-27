import type { ParsedCSV } from './types';

/**
 * RFC-4180 compliant CSV parser.
 * Handles quoted values, commas inside quotes, newlines inside quotes, and escaped double quotes ("").
 */
export function parseCSV(rawInput: string): ParsedCSV {
  const input = rawInput.replace(/^\uFEFF/, ''); // Strip UTF-8 BOM if present
  const lineEnding: '\r\n' | '\n' = input.includes('\r\n') ? '\r\n' : '\n';
  const hadTrailingNewline = input.endsWith('\n') || input.endsWith('\r');

  if (!input.trim()) {
    return {
      headers: [],
      rows: [],
      delimiter: ',',
      lineEnding,
      hadTrailingNewline,
    };
  }

  const allRows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < input.length && input[i + 1] === '"') {
          // Escaped double quote
          currentField += '"';
          i += 2;
        } else {
          // Closing quote
          inQuotes = false;
          i += 1;
        }
      } else {
        currentField += ch;
        i += 1;
      }
    } else {
      if (ch === '"' && currentField.length === 0) {
        inQuotes = true;
        i += 1;
      } else if (ch === ',') {
        currentRow.push(currentField);
        currentField = '';
        i += 1;
      } else if (ch === '\r') {
        currentRow.push(currentField);
        currentField = '';
        allRows.push(currentRow);
        currentRow = [];
        if (i + 1 < input.length && input[i + 1] === '\n') {
          i += 2;
        } else {
          i += 1;
        }
      } else if (ch === '\n') {
        currentRow.push(currentField);
        currentField = '';
        allRows.push(currentRow);
        currentRow = [];
        i += 1;
      } else {
        currentField += ch;
        i += 1;
      }
    }
  }

  // Flush final row if non-empty or if line did not end cleanly after a row terminator
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    allRows.push(currentRow);
  }

  // Drop trailing single empty row caused by trailing newline
  while (
    allRows.length > 1 &&
    allRows[allRows.length - 1].length === 1 &&
    allRows[allRows.length - 1][0] === ''
  ) {
    allRows.pop();
  }

  if (allRows.length === 0) {
    return {
      headers: [],
      rows: [],
      delimiter: ',',
      lineEnding,
      hadTrailingNewline,
    };
  }

  const headers = allRows[0];
  const columnCount = headers.length;
  const dataRows = allRows.slice(1).map((row) => {
    if (row.length < columnCount) {
      return [...row, ...Array(columnCount - row.length).fill('')];
    }
    return row;
  });

  return {
    headers,
    rows: dataRows,
    delimiter: ',',
    lineEnding,
    hadTrailingNewline,
  };
}

const SAFE_NUMERIC_REGEX = /^-\d+(?:\.\d+)?$/;

/**
 * Neutralizes spreadsheet formula injection (DDE / Excel / Sheets formula execution)
 * by prefixing cells beginning with =, +, @, tab, CR, or non-numeric - with a single quote.
 */
export function neutralizeCSVFormula(value: string): string {
  if (!value) return value;
  const firstChar = value[0];
  if (
    firstChar === '=' ||
    firstChar === '+' ||
    firstChar === '@' ||
    firstChar === '\t' ||
    firstChar === '\r' ||
    (firstChar === '-' && !SAFE_NUMERIC_REGEX.test(value.trim()))
  ) {
    return `'${value}`;
  }
  return value;
}

function escapeCSVCell(value: string, delimiter = ',', neutralizeFormulas = false): string {
  const safeValue = neutralizeFormulas ? neutralizeCSVFormula(value) : value;
  const needsQuotes =
    safeValue.includes(delimiter) ||
    safeValue.includes('"') ||
    safeValue.includes('\n') ||
    safeValue.includes('\r');
  if (!needsQuotes) return safeValue;
  return `"${safeValue.replace(/"/g, '""')}"`;
}

export function serializeCSV(
  parsed: ParsedCSV,
  rowsOverride?: string[][],
  options?: { neutralizeFormulas?: boolean }
): string {
  if (parsed.headers.length === 0) return '';
  const delimiter = parsed.delimiter || ',';
  const neutralize = options?.neutralizeFormulas ?? false;
  const headerLine = parsed.headers
    .map((h) => escapeCSVCell(h, delimiter, neutralize))
    .join(delimiter);
  const bodyRows = rowsOverride ?? parsed.rows;
  const bodyLines = bodyRows.map((row) =>
    row.map((cell) => escapeCSVCell(cell, delimiter, neutralize)).join(delimiter)
  );
  const output = [headerLine, ...bodyLines].join(parsed.lineEnding);
  return parsed.hadTrailingNewline ? output + parsed.lineEnding : output;
}
