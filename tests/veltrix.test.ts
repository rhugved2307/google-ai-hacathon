import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { neutralizeCSVFormula, parseCSV, serializeCSV } from '../src/engine/csvParser';
import { scanAndSanitizeCSV } from '../src/engine/csvSanitizer';
import { DEMO_CSV_SAMPLE, DEMO_TEXT_SAMPLE } from '../src/engine/demoData';
import { scanAndSanitizeText } from '../src/engine/detector';
import {
  getDefaultCustomReplacements,
  getDefaultEnabledCategories,
} from '../src/engine/patterns';
import type { RedactionMode, ScanOptions } from '../src/engine/types';
import {
  isValidDateString,
  isValidIPv4,
  isValidLuhn,
  validateAadhaar,
  validateCustomRegexPattern,
  validateIndianPhone,
  validatePAN,
  validateUPI,
} from '../src/engine/validators';
import {
  MAX_FILE_SIZE_BYTES,
  hasSuspiciousBinaryContent,
  readLocalFile,
  validateUploadedFile,
} from '../src/utils/fileUtils';

function makeOptions(overrides?: Partial<ScanOptions>): ScanOptions {
  return {
    redactionMode: 'full',
    customReplacements: getDefaultCustomReplacements(),
    enabledCategories: getDefaultEnabledCategories(),
    customRules: [],
    ...overrides,
  };
}

describe('A. Text Input Edge Cases', () => {
  it('handles empty and whitespace-only input safely', () => {
    const emptyRes = scanAndSanitizeText('', makeOptions());
    assert.equal(emptyRes.sanitizedText, '');
    assert.equal(emptyRes.stats.totalDetections, 0);

    const wsRes = scanAndSanitizeText('   \n\t  ', makeOptions());
    assert.equal(wsRes.sanitizedText, '   \n\t  ');
    assert.equal(wsRes.stats.totalDetections, 0);
  });

  it('preserves normal non-PII text verbatim', () => {
    const input = 'VELTRIX operates locally inside the browser with deterministic patterns.';
    const res = scanAndSanitizeText(input, makeOptions());
    assert.equal(res.sanitizedText, input);
    assert.equal(res.stats.totalDetections, 0);
  });

  it('handles Unicode, Devanagari, emoji, special characters, and CRLF line breaks', () => {
    const input =
      'ग्राहक जानकारी 🔒\r\nEmail: rahul.sharma@gmail.com\r\nPhone: +91 9876543210\r\nNote: 100% safe & clean!';
    const res = scanAndSanitizeText(input, makeOptions());
    assert.ok(res.sanitizedText.includes('ग्राहक जानकारी 🔒\r\n'));
    assert.ok(res.sanitizedText.includes('[EMAIL]'));
    assert.ok(res.sanitizedText.includes('[PHONE]'));
    assert.ok(!res.sanitizedText.includes('rahul.sharma@gmail.com'));
    assert.ok(!res.sanitizedText.includes('9876543210'));
    assert.ok(res.sanitizedText.includes('Note: 100% safe & clean!'));
  });

  it('does not execute or alter XSS-like strings other than redacting embedded PII', () => {
    const input = '<script>alert("xss")</script> Contact: <img src=x onerror=alert(1)> test@example.com';
    const res = scanAndSanitizeText(input, makeOptions());
    assert.ok(res.sanitizedText.includes('<script>alert("xss")</script>'));
    assert.ok(res.sanitizedText.includes('[EMAIL]'));
    assert.ok(!res.sanitizedText.includes('test@example.com'));
  });
});

describe('B. PII Detection Accuracy (Valid & Invalid Cases)', () => {
  it('detects all 13 demo PII fields in DEMO_TEXT_SAMPLE without leaking originals', () => {
    const res = scanAndSanitizeText(DEMO_TEXT_SAMPLE, makeOptions());
    const foundTypes = new Set(res.detections.map((d) => d.type));
    for (const expected of [
      'PERSON',
      'EMAIL',
      'PHONE',
      'AADHAAR',
      'PAN',
      'UPI',
      'CARD',
      'IP_ADDRESS',
      'DOB',
      'ADDRESS',
      'PASSPORT',
      'BANK_ACCOUNT',
      'PIN_CODE',
    ] as const) {
      assert.ok(foundTypes.has(expected), `Expected ${expected} to be detected`);
    }
    for (const secret of [
      'Rahul Sharma',
      'rahul.sharma@gmail.com',
      '9876543210',
      '1234 5678 9012',
      'ABCDE1234F',
      'rahul@oksbi',
      '4111 1111 1111 1111',
      '192.168.1.25',
      '12/05/2005',
      'A1234567',
      '411001',
    ]) {
      assert.ok(!res.sanitizedText.includes(secret), `Secret "${secret}" leaked in sanitized text`);
    }
  });

  it('validates Emails, UPIs, and URLs cleanly without false collisions', () => {
    const res = scanAndSanitizeText(
      'Site: https://example.org/profile?id=42. Mail: alice@corp.co.in, Pay: alice@okhdfcbank',
      makeOptions()
    );
    assert.deepEqual(
      res.detections.map((d) => d.type),
      ['URL', 'EMAIL', 'UPI']
    );
    assert.equal(validateUPI('alice@gmail.com', true).valid, false);
    assert.equal(validateUPI('alice@okicici', false).valid, true);
    assert.equal(validateUPI('a@b', false).valid, false);
  });

  it('validates Indian phones, Aadhaar, PAN, IPv4, Luhn cards, and Calendar DOBs', () => {
    // Phones
    assert.equal(validateIndianPhone('+91 9876543210').valid, true);
    assert.equal(validateIndianPhone('5123456789').valid, false);
    assert.equal(validateIndianPhone('9999999999').valid, false);

    // Aadhaar
    assert.equal(validateAadhaar('2345 6789 0123', false).valid, true);
    assert.equal(validateAadhaar('0000 0000 0000', true).valid, false);

    // PAN
    assert.equal(validatePAN('ABCDE1234F', false).valid, true);
    assert.equal(validatePAN('ABC121234F', true).valid, false);

    // Luhn Card
    assert.equal(isValidLuhn('4111 1111 1111 1111'), true);
    assert.equal(isValidLuhn('4111 1111 1111 1112'), false);
    assert.equal(isValidLuhn('0000 0000 0000 0000'), false);

    // IPv4
    assert.equal(isValidIPv4('192.168.1.25'), true);
    assert.equal(isValidIPv4('256.168.1.25'), false);
    assert.equal(isValidIPv4('192.168.01.25'), false);

    // Calendar-accurate DOB validation (rejects Feb 31 & non-leap Feb 29)
    assert.equal(isValidDateString('29/02/2024'), true);
    assert.equal(isValidDateString('29/02/2023'), false);
    assert.equal(isValidDateString('31/02/2000'), false);
    assert.equal(isValidDateString('31 Apr 2005'), false);
    assert.equal(isValidDateString('12 May 2005'), true);

    // Invalid DOB should NOT be flagged in text
    const invalidDob = scanAndSanitizeText('DOB: 31/02/2000', makeOptions());
    assert.equal(invalidDob.detections.length, 0);
  });
});

describe('C. Redaction Modes, Overlaps, Repetition & Punctuation', () => {
  it('supports Full, Partial, and Custom redaction modes accurately', () => {
    const sample = 'Email: rahul.sharma@gmail.com | Phone: +91 9876543210 | PAN: ABCDE1234F';

    const modes: RedactionMode[] = ['full', 'partial', 'custom'];
    const [full, partial, custom] = modes.map((redactionMode) =>
      scanAndSanitizeText(sample, makeOptions({ redactionMode }))
    );

    assert.equal(full.sanitizedText, 'Email: [EMAIL] | Phone: [PHONE] | PAN: [PAN]');
    assert.ok(partial.sanitizedText.includes('r***********@gmail.com'));
    assert.ok(partial.sanitizedText.includes('+91 ******3210'));
    assert.ok(partial.sanitizedText.includes('AB***34*F'));
    assert.ok(!partial.sanitizedText.includes('rahul.sharma@gmail.com'));
    assert.ok(!partial.sanitizedText.includes('9876543210'));
    assert.ok(!partial.sanitizedText.includes('ABCDE1234F'));
    assert.equal(
      custom.sanitizedText,
      'Email: [PRIVATE EMAIL] | Phone: [CONTACT REDACTED] | PAN: [PAN REDACTED]'
    );
  });

  it('handles repeated, adjacent, and punctuated sensitive values cleanly', () => {
    const input = 'Contact (rahul@gmail.com,+91 9876543210); backup: rahul@gmail.com.';
    const res = scanAndSanitizeText(input, makeOptions());
    assert.equal(res.sanitizedText, 'Contact ([EMAIL],[PHONE]); backup: [EMAIL].');
    assert.equal(res.stats.totalDetections, 3);
  });

  it('resolves overlapping matches deterministically (UPI vs Phone on mobile@paytm)', () => {
    const res = scanAndSanitizeText('UPI: 9765432109@paytm', makeOptions());
    assert.equal(res.detections.length, 1);
    assert.equal(res.detections[0].type, 'UPI');
    assert.equal(res.sanitizedText, 'UPI: [UPI]');
  });

  it('blocks ReDoS custom regexes while allowing safe custom regexes', () => {
    assert.equal(validateCustomRegexPattern('(a+)+$').valid, false);
    assert.equal(validateCustomRegexPattern('([a-zA-Z]+)*').valid, false);
    assert.equal(validateCustomRegexPattern('(a|aa)+').valid, false);
    assert.equal(validateCustomRegexPattern('\\bEMP-\\d{5}\\b', 'gi').valid, true);

    const res = scanAndSanitizeText(
      'Employee EMP-48291 logged in.',
      makeOptions({
        customRules: [
          {
            id: 'r1',
            name: 'Employee ID',
            pattern: '\\bEMP-\\d{5}\\b',
            flags: 'gi',
            replacement: '[EMP_ID]',
            confidence: 'high',
            enabled: true,
          },
          {
            id: 'r2',
            name: 'Malicious ReDoS',
            pattern: '(a+)+$',
            flags: 'g',
            replacement: '[BAD]',
            confidence: 'low',
            enabled: true,
          },
        ],
      })
    );
    assert.equal(res.sanitizedText, 'Employee [EMP_ID] logged in.');
  });
});

describe('D & E. File Upload Validation, CSV Parsing, Formula Neutralization & Export Safety', () => {
  it('validates allowed, empty, oversized, spoofed-extension, and binary files', async () => {
    const goodTxt = new File(['Email: a@b.com'], 'notes.txt', { type: 'text/plain' });
    assert.equal(validateUploadedFile(goodTxt).valid, true);

    const goodCsv = new File(['Name,Email\nA,a@b.com'], 'data.csv', { type: 'text/csv' });
    assert.equal(validateUploadedFile(goodCsv).fileType, 'csv');

    const emptyFile = new File([''], 'empty.txt', { type: 'text/plain' });
    assert.equal(validateUploadedFile(emptyFile).valid, false);

    // Spoofed MIME on dangerous extension must be rejected
    const spoofedHtml = new File(['<script>alert(1)</script>'], 'payload.html', {
      type: 'text/plain',
    });
    assert.equal(validateUploadedFile(spoofedHtml).valid, false);

    // Oversized file check
    const oversized = {
      name: 'huge.txt',
      size: MAX_FILE_SIZE_BYTES + 1,
      type: 'text/plain',
    } as File;
    assert.equal(validateUploadedFile(oversized).valid, false);

    // Binary/NUL byte file renamed to .txt must be rejected
    assert.equal(hasSuspiciousBinaryContent('PNG\x00\x01\x02binary'), true);
    const binaryTxt = new File(['ELF\x00\x01\x02\x03'], 'fake.txt', { type: 'text/plain' });
    await assert.rejects(() => readLocalFile(binaryTxt), /binary or corrupted/i);
  });

  it('parses RFC-4180 CSV with BOM, quoted commas, escaped quotes, multiline cells, and empty cells', () => {
    const csv = '\uFEFFName,Notes,EmptyCol\r\n"Doe, ""John""","Line 1\nLine 2",\r\n';
    const parsed = parseCSV(csv);
    assert.deepEqual(parsed.headers, ['Name', 'Notes', 'EmptyCol']);
    assert.equal(parsed.rows.length, 1);
    assert.equal(parsed.rows[0][0], 'Doe, "John"');
    assert.equal(parsed.rows[0][1], 'Line 1\nLine 2');
    assert.equal(parsed.rows[0][2], '');
    const reserialized = serializeCSV(parsed);
    assert.equal(parseCSV(reserialized).rows[0][0], 'Doe, "John"');
  });

  it('neutralizes CSV spreadsheet formula injection while preserving valid negative numbers', () => {
    assert.equal(neutralizeCSVFormula('=CMD|\' /C calc\'!A0'), "'=CMD|' /C calc'!A0");
    assert.equal(neutralizeCSVFormula('+1+1'), "'+1+1");
    assert.equal(neutralizeCSVFormula('@SUM(A1:A5)'), "'@SUM(A1:A5)");
    assert.equal(neutralizeCSVFormula('-42.50'), '-42.50');
    assert.equal(neutralizeCSVFormula('-cmd|calc'), "'-cmd|calc");

    const maliciousCsv = 'Name,Formula,Balance\nRahul Sharma,"=HYPERLINK(""http://evil.example"")",-150.25';
    const out = scanAndSanitizeCSV(maliciousCsv, makeOptions());
    assert.ok(!out.sanitizedCSV.includes('Rahul Sharma'));
    assert.ok(out.sanitizedCSV.includes("'=HYPERLINK("));
    assert.ok(out.sanitizedCSV.includes(',-150.25'));
  });

  it('sanitizes DEMO_CSV_SAMPLE completely with zero leaked PII and respects column selection', () => {
    const fullCsvOut = scanAndSanitizeCSV(DEMO_CSV_SAMPLE, makeOptions());
    assert.equal(fullCsvOut.totalRows, 4);
    assert.equal(fullCsvOut.totalColumns, 8);
    assert.ok(fullCsvOut.aggregateResult.stats.totalDetections >= 20);
    for (const secret of [
      'rahul.sharma@gmail.com',
      'ABCDE1234F',
      'priya@okhdfcbank',
      '9765432109@paytm',
      'sneha.k@workmail.in',
    ]) {
      assert.ok(!fullCsvOut.sanitizedCSV.includes(secret), `CSV leaked ${secret}`);
    }

    // Excluding Email column (#1) preserves raw email while redacting other selected columns
    const partialCols = scanAndSanitizeCSV(DEMO_CSV_SAMPLE, makeOptions(), [0, 2, 3, 4, 5]);
    assert.ok(partialCols.sanitizedCSV.includes('rahul.sharma@gmail.com'));
    assert.ok(!partialCols.sanitizedCSV.includes('ABCDE1234F'));
  });
});

describe('F. Static Privacy, Security & Accessibility Verification', () => {
  it('verifies zero external network calls, unsafe HTML sinks, or PII console logs across src/', () => {
    const srcDir = path.resolve(process.cwd(), 'src');
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
      }
    };
    walk(srcDir);

    const forbidden = [
      /\bfetch\s*\(/,
      /\bXMLHttpRequest\b/,
      /\baxios\b/,
      /\bdangerouslySetInnerHTML\b/,
      /\.innerHTML\b/,
      /\bconsole\.(log|info|warn|error|debug)\s*\(/,
      /\beval\s*\(/,
      /new\s+Function\s*\(/,
    ];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      for (const pattern of forbidden) {
        assert.equal(
          pattern.test(content),
          false,
          `Forbidden pattern ${pattern} found in ${path.relative(process.cwd(), file)}`
        );
      }
    }

    // Verify exact required local privacy notice and skip link exist in App.tsx
    const appSource = fs.readFileSync(path.join(srcDir, 'App.tsx'), 'utf8');
    assert.ok(appSource.includes('YOUR DATA STAYS ON THIS DEVICE — PROCESSING HAPPENS LOCALLY.'));
    assert.ok(appSource.includes('Skip to main content'));
    assert.ok(appSource.includes('aria-live="polite"'));
  });
});

describe('G. Real Measured Performance Benchmarks', () => {
  it('benchmarks Small, Medium, and Large text and CSV workloads within responsive limits', () => {
    const opts = makeOptions();

    const smallText = DEMO_TEXT_SAMPLE;
    const mediumText = Array.from({ length: 65 }, () => DEMO_TEXT_SAMPLE).join('\n\n');
    const largeText = Array.from({ length: 650 }, () => DEMO_TEXT_SAMPLE).join('\n\n');

    const bench = (label: string, fn: () => { detections: number; chars: number }) => {
      const t0 = performance.now();
      const info = fn();
      const ms = Math.round((performance.now() - t0) * 100) / 100;
      console.log(
        `[BENCHMARK] ${label}: ${info.chars.toLocaleString()} chars | ${info.detections.toLocaleString()} detections | ${ms} ms`
      );
      return { ms, ...info };
    };

    const sRes = bench('Text Small', () => {
      const r = scanAndSanitizeText(smallText, opts);
      return { detections: r.stats.totalDetections, chars: smallText.length };
    });
    const mRes = bench('Text Medium', () => {
      const r = scanAndSanitizeText(mediumText, opts);
      return { detections: r.stats.totalDetections, chars: mediumText.length };
    });
    const lRes = bench('Text Large', () => {
      const r = scanAndSanitizeText(largeText, opts);
      return { detections: r.stats.totalDetections, chars: largeText.length };
    });

    const csvHeader = DEMO_CSV_SAMPLE.split('\n')[0];
    const csvRows = DEMO_CSV_SAMPLE.split('\n').slice(1);
    const buildCsv = (repeatBlocks: number) =>
      [csvHeader, ...Array.from({ length: repeatBlocks }, () => csvRows.join('\n'))].join('\n');

    const smallCsv = buildCsv(3); // 12 rows
    const mediumCsv = buildCsv(60); // 240 rows
    const largeCsv = buildCsv(500); // 2,000 rows

    const csRes = bench('CSV Small (12 rows)', () => {
      const r = scanAndSanitizeCSV(smallCsv, opts);
      return { detections: r.aggregateResult.stats.totalDetections, chars: smallCsv.length };
    });
    const cmRes = bench('CSV Medium (240 rows)', () => {
      const r = scanAndSanitizeCSV(mediumCsv, opts);
      return { detections: r.aggregateResult.stats.totalDetections, chars: mediumCsv.length };
    });
    const clRes = bench('CSV Large (2,000 rows)', () => {
      const r = scanAndSanitizeCSV(largeCsv, opts);
      return { detections: r.aggregateResult.stats.totalDetections, chars: largeCsv.length };
    });

    assert.ok(sRes.ms < 100);
    assert.ok(mRes.ms < 500);
    assert.ok(lRes.ms < 2500);
    assert.ok(csRes.ms < 150);
    assert.ok(cmRes.ms < 1000);
    assert.ok(clRes.ms < 5000);
  });
});
