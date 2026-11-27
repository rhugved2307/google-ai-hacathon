import type { ConfidenceLevel } from './types';

/**
 * Known Indian UPI Payment Service Provider (PSP) handles.
 * Used to disambiguate UPI IDs from email addresses.
 */
export const KNOWN_UPI_HANDLES = new Set([
  'upi',
  'oksbi',
  'okhdfcbank',
  'okicici',
  'okaxis',
  'ybl',
  'ibl',
  'axl',
  'paytm',
  'apl',
  'sbi',
  'hdfcbank',
  'icici',
  'axisbank',
  'kotak',
  'barodampay',
  'indus',
  'federal',
  'fbl',
  'pnb',
  'cnrb',
  'jio',
  'airtel',
  'airtelpaymentsbank',
  'freecharge',
  'mobikwik',
  'uboi',
  'mahb',
  'idbi',
  'dbs',
  'hsbc',
  'rbl',
  'yesbank',
  'yesbankltd',
  'slice',
  'jupiteraxis',
  'naviaxis',
  'pingpay',
  'waaxis',
  'wahdfcbank',
  'waicici',
  'wasbi',
  'ikwik',
  'timecosmos',
  'kbl',
  'sib',
  'cub',
  'tjsb',
  'bandhan',
  'equitas',
  'aubank',
  'idfcfirst',
  'postbank',
  'indianbank',
  'iob',
  'centralbank',
  'unionbankofindia',
  'canarabank',
  'bob',
]);

/**
 * Luhn checksum validation for payment card numbers.
 */
export function isValidLuhn(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  // Reject all-zero or obviously repeated single-digit dummy sequences except known test cards like 4111...
  if (/^0+$/.test(digits)) return false;

  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (d < 0 || d > 9) return false;
    if (shouldDouble) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

/**
 * Checks whether a card number matches known card network IIN prefixes.
 */
export function hasKnownCardPrefix(raw: string): boolean {
  const d = raw.replace(/\D/g, '');
  if (d.length < 13 || d.length > 19) return false;
  // Visa (4), Mastercard (51-55, 2221-2720), Amex (34, 37), Discover (6011, 644-649, 65), RuPay (60, 6521, 6522, 81, 82, 508), Diners/Maestro
  return (
    /^4\d{12}(\d{3})?(\d{3})?$/.test(d) ||
    /^5[1-5]\d{14}$/.test(d) ||
    /^2(?:22[1-9]|2[3-9]\d|[3-6]\d{2}|7[01]\d|720)\d{12}$/.test(d) ||
    /^3[47]\d{13}$/.test(d) ||
    /^(?:6011|65\d{2}|64[4-9]\d)\d{12}$/.test(d) ||
    /^(?:60|6521|6522|81|82|508)\d{12,16}$/.test(d) ||
    /^(?:3(?:0[0-5]|[68]\d)\d{11}|5[06-8]\d{10,17})$/.test(d)
  );
}

/**
 * Verhoeff checksum algorithm (official Aadhaar checksum).
 * Used to boost confidence; pattern detection is not official identity verification.
 */
const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

export function isValidVerhoeff(numStr: string): boolean {
  const digits = numStr.replace(/\D/g, '');
  if (!/^\d{12}$/.test(digits)) return false;
  let c = 0;
  for (let i = 0; i < digits.length; i++) {
    const digit = digits.charCodeAt(digits.length - 1 - i) - 48;
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][digit]];
  }
  return c === 0;
}

export function validateAadhaar(
  raw: string,
  hasAadhaarContext: boolean
): { valid: boolean; confidence: ConfidenceLevel } {
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 12) return { valid: false, confidence: 'low' };
  // Reject trivial all-identical digits (e.g. 000000000000)
  if (/^(\d)\1{11}$/.test(digits)) return { valid: false, confidence: 'low' };

  const hasGrouping = /^\d{4}[\s-]\d{4}[\s-]\d{4}$/.test(raw.trim());
  const startsOfficial = /^[2-9]/.test(digits);
  const passesVerhoeff = startsOfficial && isValidVerhoeff(digits);

  if (hasAadhaarContext) {
    return { valid: true, confidence: passesVerhoeff || hasGrouping ? 'high' : 'medium' };
  }
  if (passesVerhoeff) {
    return { valid: true, confidence: 'high' };
  }
  if (hasGrouping) {
    return { valid: true, confidence: startsOfficial ? 'high' : 'medium' };
  }
  return { valid: false, confidence: 'low' };
}

export function validatePAN(
  raw: string,
  hasPANContext: boolean
): { valid: boolean; confidence: ConfidenceLevel } {
  const cleaned = raw.trim().toUpperCase();
  if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(cleaned)) {
    return { valid: false, confidence: 'low' };
  }
  // 4th character denotes Indian PAN holder category (P=Individual, C=Company, H=HUF, F=Firm, A=AOP, T=Trust, B=BOI, L=Local Auth, J=AJP, G=Govt)
  const official4thChar = /[ABCFGHLJPT]/.test(cleaned[3]);
  if (official4thChar || hasPANContext) {
    return { valid: true, confidence: 'high' };
  }
  return { valid: true, confidence: 'medium' };
}

export function validateIndianPhone(raw: string): { valid: boolean; confidence: ConfidenceLevel } {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, '');

  // Check +91 / 91 / 0 prefixed or bare 10-digit Indian mobile numbers starting with 6-9
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    if (/^(\d)\1{9}$/.test(digits)) return { valid: false, confidence: 'low' };
    return { valid: true, confidence: 'high' };
  }
  if (digits.length === 11 && /^0[6-9]\d{9}$/.test(digits)) {
    return { valid: true, confidence: 'high' };
  }
  if (digits.length === 12 && /^91[6-9]\d{9}$/.test(digits)) {
    // Only treat 12-digit 91... as phone if explicitly prefixed with +91 or separator after 91
    if (/^\+?91[\s-]?[6-9]/.test(trimmed)) {
      return { valid: true, confidence: 'high' };
    }
  }
  return { valid: false, confidence: 'low' };
}

export function isValidIPv4(raw: string): boolean {
  const parts = raw.trim().split('.');
  if (parts.length !== 4) return false;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return false;
    if (part.length > 1 && part.startsWith('0')) return false;
    const num = Number(part);
    if (!Number.isInteger(num) || num < 0 || num > 255) return false;
  }
  return true;
}

export function validateUPI(
  raw: string,
  hasUPIContext: boolean
): { valid: boolean; confidence: ConfidenceLevel } {
  const trimmed = raw.trim().toLowerCase();
  const parts = trimmed.split('@');
  if (parts.length !== 2) return { valid: false, confidence: 'low' };
  const [handleUser, provider] = parts;
  if (!handleUser || !provider) return { valid: false, confidence: 'low' };
  // Standard email domains contain a dot TLD like .com, .in, .org — never treat those as UPI
  if (provider.includes('.')) return { valid: false, confidence: 'low' };
  if (!/^[a-z0-9._-]{2,64}$/.test(handleUser)) return { valid: false, confidence: 'low' };
  if (!/^[a-z][a-z0-9]{1,30}$/.test(provider)) return { valid: false, confidence: 'low' };

  if (KNOWN_UPI_HANDLES.has(provider)) {
    return { valid: true, confidence: 'high' };
  }
  if (hasUPIContext) {
    return { valid: true, confidence: 'high' };
  }
  return { valid: false, confidence: 'low' };
}

const MONTH_NAME_TO_NUM: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  sept: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

function daysInMonth(year: number, month: number): number {
  if (month < 1 || month > 12) return 0;
  if (month === 2) {
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return isLeap ? 29 : 28;
  }
  if (month === 4 || month === 6 || month === 9 || month === 11) {
    return 30;
  }
  return 31;
}

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (year < 1900 || year > 2099) return false;
  if (month < 1 || month > 12) return false;
  return day >= 1 && day <= daysInMonth(year, month);
}

export function isValidDateString(raw: string): boolean {
  const trimmed = raw.trim();
  // YYYY-MM-DD or YYYY/MM/DD
  let m = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(trimmed);
  if (m) {
    return isValidCalendarDate(Number(m[1]), Number(m[2]), Number(m[3]));
  }
  // DD/MM/YYYY or DD-MM-YYYY or MM/DD/YYYY
  m = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(trimmed);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    const year = Number(m[3]);
    return isValidCalendarDate(year, b, a) || isValidCalendarDate(year, a, b);
  }
  // Textual date like 12 May 2005
  m = /^(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(\d{4})$/i.exec(
    trimmed
  );
  if (m) {
    const month = MONTH_NAME_TO_NUM[m[2].toLowerCase()];
    return isValidCalendarDate(Number(m[3]), month, Number(m[1]));
  }
  // Textual date like May 12, 2005
  m = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})$/i.exec(
    trimmed
  );
  if (m) {
    const month = MONTH_NAME_TO_NUM[m[1].toLowerCase()];
    return isValidCalendarDate(Number(m[3]), month, Number(m[2]));
  }
  return false;
}

export function validatePassport(
  raw: string,
  hasPassportContext: boolean
): { valid: boolean; confidence: ConfidenceLevel } {
  const cleaned = raw.trim().toUpperCase();
  // Indian passport: 1 letter (A-Z excluding Q, X, Z) followed by 7 digits, or general 1-2 letters + 6-8 digits
  if (hasPassportContext && /^[A-Z]{1,2}\d{6,8}$/.test(cleaned)) {
    return { valid: true, confidence: 'high' };
  }
  if (/^[A-PR-WY][1-9]\d{6}$/.test(cleaned) && hasPassportContext) {
    return { valid: true, confidence: 'high' };
  }
  return { valid: false, confidence: 'low' };
}

export function isValidIndianPinCode(raw: string): boolean {
  const digits = raw.replace(/\s/g, '');
  return /^[1-9]\d{5}$/.test(digits);
}

export const MAX_CUSTOM_REGEX_LENGTH = 200;

/**
 * Validates user-supplied regular expressions to prevent syntax errors and catastrophic
 * backtracking (ReDoS) before running them against document text.
 */
export function validateCustomRegexPattern(
  pattern: string,
  flags = 'g'
): { valid: boolean; error?: string; safeFlags: string } {
  const trimmed = pattern.trim();
  const safeFlags = Array.from(new Set((flags + 'g').replace(/[^gimsu]/g, ''))).join('');

  if (!trimmed) {
    return { valid: false, error: 'Please enter a regular expression pattern.', safeFlags };
  }
  if (trimmed.length > MAX_CUSTOM_REGEX_LENGTH) {
    return {
      valid: false,
      error: `Regex pattern must be ${MAX_CUSTOM_REGEX_LENGTH} characters or fewer.`,
      safeFlags,
    };
  }

  // Reject common catastrophic backtracking structures (nested quantifiers, quantified backreferences)
  const nestedQuantifierPattern =
    /\((?:[^()\\]|\\.)*(?:[+*]|\{\d+,\d*\})(?:[^()\\]|\\.)*\)(?:[+*?]|\{\d+,?\d*\})/;
  const overlappingAlternationQuantifier =
    /\((?:[^()\\|]|\\.)+\|(?:[^()\\|]|\\.)+\)(?:[+*]|\{\d+,\d*\})/;
  const quantifiedBackreference = /\\[1-9](?:[+*]|\{\d+,\d*\})/;

  if (
    nestedQuantifierPattern.test(trimmed) ||
    overlappingAlternationQuantifier.test(trimmed) ||
    quantifiedBackreference.test(trimmed)
  ) {
    return {
      valid: false,
      error:
        'Pattern rejected: nested quantifiers or repeated alternations can freeze the browser (ReDoS risk). Simplify the regex.',
      safeFlags,
    };
  }

  let compiled: RegExp;
  try {
    compiled = new RegExp(trimmed, safeFlags);
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? `Invalid regex: ${err.message}` : 'Invalid regular expression.',
      safeFlags,
    };
  }

  // Fast runtime backtracking probe on a short non-matching string
  const probe = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaa!';
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  compiled.test(probe);
  const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0;
  if (elapsed > 15) {
    return {
      valid: false,
      error: 'Pattern rejected: excessive regex backtracking detected.',
      safeFlags,
    };
  }

  return { valid: true, safeFlags };
}
