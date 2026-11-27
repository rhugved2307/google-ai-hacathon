import type { CategoryMeta, ConfidenceLevel, PIICategory } from './types';
import {
  hasKnownCardPrefix,
  isValidDateString,
  isValidIPv4,
  isValidIndianPinCode,
  isValidLuhn,
  validateAadhaar,
  validateIndianPhone,
  validatePAN,
  validatePassport,
  validateUPI,
} from './validators';

export const CATEGORY_LIST: PIICategory[] = [
  'EMAIL',
  'PHONE',
  'AADHAAR',
  'PAN',
  'CARD',
  'UPI',
  'IP_ADDRESS',
  'URL',
  'DOB',
  'PERSON',
  'ADDRESS',
  'PASSPORT',
  'BANK_ACCOUNT',
  'PIN_CODE',
  'CUSTOM',
];

export const CATEGORY_META: Record<PIICategory, CategoryMeta> = {
  EMAIL: {
    id: 'EMAIL',
    label: 'Email Address',
    shortLabel: 'EMAIL',
    description: 'Personal or corporate email addresses',
    defaultCustomReplacement: '[PRIVATE EMAIL]',
    priority: 95,
    colorKey: 'violet',
    accentHex: '#8B5CF6',
    highlightLight: 'bg-violet-100 text-violet-950 border-violet-300',
    highlightDark: 'dark:bg-violet-500/20 dark:text-violet-200 dark:border-violet-400/50',
    barClass: 'bg-[#8B5CF6]',
    dotClass: 'bg-[#8B5CF6]',
    textClass: 'text-violet-700 dark:text-[#A78BFA]',
  },
  PHONE: {
    id: 'PHONE',
    label: 'Phone Number',
    shortLabel: 'PHONE',
    description: 'Indian mobile and contact numbers',
    defaultCustomReplacement: '[CONTACT REDACTED]',
    priority: 82,
    colorKey: 'cyan',
    accentHex: '#22D3EE',
    highlightLight: 'bg-cyan-100 text-cyan-950 border-cyan-300',
    highlightDark: 'dark:bg-cyan-500/20 dark:text-cyan-200 dark:border-cyan-400/50',
    barClass: 'bg-[#22D3EE]',
    dotClass: 'bg-[#22D3EE]',
    textClass: 'text-cyan-700 dark:text-[#22D3EE]',
  },
  AADHAAR: {
    id: 'AADHAAR',
    label: 'Aadhaar Number',
    shortLabel: 'AADHAAR',
    description: '12-digit Aadhaar identifier patterns (pattern match, not official verification)',
    defaultCustomReplacement: '[AADHAAR REDACTED]',
    priority: 90,
    colorKey: 'red',
    accentHex: '#F87171',
    highlightLight: 'bg-red-100 text-red-950 border-red-300',
    highlightDark: 'dark:bg-red-500/20 dark:text-red-200 dark:border-red-400/50',
    barClass: 'bg-[#F87171]',
    dotClass: 'bg-[#F87171]',
    textClass: 'text-red-700 dark:text-[#F87171]',
  },
  PAN: {
    id: 'PAN',
    label: 'PAN Number',
    shortLabel: 'PAN',
    description: 'Indian Permanent Account Number identifiers',
    defaultCustomReplacement: '[PAN REDACTED]',
    priority: 92,
    colorKey: 'orange',
    accentHex: '#FB923C',
    highlightLight: 'bg-orange-100 text-orange-950 border-orange-300',
    highlightDark: 'dark:bg-orange-500/20 dark:text-orange-200 dark:border-orange-400/50',
    barClass: 'bg-orange-400',
    dotClass: 'bg-orange-400',
    textClass: 'text-orange-700 dark:text-orange-300',
  },
  CARD: {
    id: 'CARD',
    label: 'Payment Card',
    shortLabel: 'CARD',
    description: 'Luhn-validated credit and debit card numbers',
    defaultCustomReplacement: '[CARD REDACTED]',
    priority: 94,
    colorKey: 'pink',
    accentHex: '#F472B6',
    highlightLight: 'bg-pink-100 text-pink-950 border-pink-300',
    highlightDark: 'dark:bg-pink-500/20 dark:text-pink-200 dark:border-pink-400/50',
    barClass: 'bg-pink-400',
    dotClass: 'bg-pink-400',
    textClass: 'text-pink-700 dark:text-pink-300',
  },
  UPI: {
    id: 'UPI',
    label: 'UPI ID',
    shortLabel: 'UPI',
    description: 'Unified Payments Interface virtual payment addresses',
    defaultCustomReplacement: '[UPI REDACTED]',
    priority: 93,
    colorKey: 'emerald',
    accentHex: '#10B981',
    highlightLight: 'bg-emerald-100 text-emerald-950 border-emerald-300',
    highlightDark: 'dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-400/50',
    barClass: 'bg-[#10B981]',
    dotClass: 'bg-[#10B981]',
    textClass: 'text-emerald-700 dark:text-[#10B981]',
  },
  IP_ADDRESS: {
    id: 'IP_ADDRESS',
    label: 'IPv4 Address',
    shortLabel: 'IP_ADDRESS',
    description: 'Validated IPv4 network addresses',
    defaultCustomReplacement: '[IP REDACTED]',
    priority: 86,
    colorKey: 'sky',
    accentHex: '#38BDF8',
    highlightLight: 'bg-sky-100 text-sky-950 border-sky-300',
    highlightDark: 'dark:bg-sky-500/20 dark:text-sky-200 dark:border-sky-400/50',
    barClass: 'bg-sky-400',
    dotClass: 'bg-sky-400',
    textClass: 'text-sky-700 dark:text-sky-300',
  },
  URL: {
    id: 'URL',
    label: 'URL / Web Link',
    shortLabel: 'URL',
    description: 'HTTP and HTTPS web URLs',
    defaultCustomReplacement: '[URL REDACTED]',
    priority: 96,
    colorKey: 'indigo',
    accentHex: '#818CF8',
    highlightLight: 'bg-indigo-100 text-indigo-950 border-indigo-300',
    highlightDark: 'dark:bg-indigo-500/20 dark:text-indigo-200 dark:border-indigo-400/50',
    barClass: 'bg-indigo-400',
    dotClass: 'bg-indigo-400',
    textClass: 'text-indigo-700 dark:text-indigo-300',
  },
  DOB: {
    id: 'DOB',
    label: 'Date of Birth',
    shortLabel: 'DOB',
    description: 'Context-verified birth dates',
    defaultCustomReplacement: '[DOB REDACTED]',
    priority: 85,
    colorKey: 'teal',
    accentHex: '#2DD4BF',
    highlightLight: 'bg-teal-100 text-teal-950 border-teal-300',
    highlightDark: 'dark:bg-teal-500/20 dark:text-teal-200 dark:border-teal-400/50',
    barClass: 'bg-teal-400',
    dotClass: 'bg-teal-400',
    textClass: 'text-teal-700 dark:text-teal-300',
  },
  PERSON: {
    id: 'PERSON',
    label: 'Person Name',
    shortLabel: 'PERSON',
    description: 'Heuristic contextual detection of individual names',
    defaultCustomReplacement: '[UNKNOWN PERSON]',
    priority: 78,
    colorKey: 'blue',
    accentHex: '#60A5FA',
    highlightLight: 'bg-blue-100 text-blue-950 border-blue-300',
    highlightDark: 'dark:bg-blue-500/20 dark:text-blue-200 dark:border-blue-400/50',
    barClass: 'bg-blue-400',
    dotClass: 'bg-blue-400',
    textClass: 'text-blue-700 dark:text-blue-300',
  },
  ADDRESS: {
    id: 'ADDRESS',
    label: 'Physical Address',
    shortLabel: 'ADDRESS',
    description: 'Street, apartment, and residential address patterns',
    defaultCustomReplacement: '[ADDRESS REDACTED]',
    priority: 76,
    colorKey: 'amber',
    accentHex: '#F59E0B',
    highlightLight: 'bg-amber-100 text-amber-950 border-amber-300',
    highlightDark: 'dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-400/50',
    barClass: 'bg-[#F59E0B]',
    dotClass: 'bg-[#F59E0B]',
    textClass: 'text-amber-700 dark:text-[#F59E0B]',
  },
  PASSPORT: {
    id: 'PASSPORT',
    label: 'Passport ID',
    shortLabel: 'PASSPORT',
    description: 'Passport numbers identified with document context',
    defaultCustomReplacement: '[PASSPORT REDACTED]',
    priority: 89,
    colorKey: 'rose',
    accentHex: '#FB7185',
    highlightLight: 'bg-rose-100 text-rose-950 border-rose-300',
    highlightDark: 'dark:bg-rose-500/20 dark:text-rose-200 dark:border-rose-400/50',
    barClass: 'bg-rose-400',
    dotClass: 'bg-rose-400',
    textClass: 'text-rose-700 dark:text-rose-300',
  },
  BANK_ACCOUNT: {
    id: 'BANK_ACCOUNT',
    label: 'Bank Account',
    shortLabel: 'BANK_ACCOUNT',
    description: 'Bank account numbers detected with account context',
    defaultCustomReplacement: '[ACCOUNT REDACTED]',
    priority: 91,
    colorKey: 'yellow',
    accentHex: '#EAB308',
    highlightLight: 'bg-yellow-100 text-yellow-950 border-yellow-300',
    highlightDark: 'dark:bg-yellow-500/20 dark:text-yellow-200 dark:border-yellow-400/50',
    barClass: 'bg-yellow-400',
    dotClass: 'bg-yellow-400',
    textClass: 'text-yellow-700 dark:text-yellow-300',
  },
  PIN_CODE: {
    id: 'PIN_CODE',
    label: 'PIN Code',
    shortLabel: 'PIN_CODE',
    description: 'Indian 6-digit postal PIN codes with postal context',
    defaultCustomReplacement: '[PIN REDACTED]',
    priority: 80,
    colorKey: 'lime',
    accentHex: '#A3E635',
    highlightLight: 'bg-lime-100 text-lime-950 border-lime-300',
    highlightDark: 'dark:bg-lime-500/20 dark:text-lime-200 dark:border-lime-400/50',
    barClass: 'bg-lime-400',
    dotClass: 'bg-lime-400',
    textClass: 'text-lime-700 dark:text-lime-300',
  },
  CUSTOM: {
    id: 'CUSTOM',
    label: 'Custom Rule',
    shortLabel: 'CUSTOM',
    description: 'User-defined custom regular expression patterns',
    defaultCustomReplacement: '[CUSTOM REDACTED]',
    priority: 88,
    colorKey: 'fuchsia',
    accentHex: '#E879F9',
    highlightLight: 'bg-fuchsia-100 text-fuchsia-950 border-fuchsia-300',
    highlightDark: 'dark:bg-fuchsia-500/20 dark:text-fuchsia-200 dark:border-fuchsia-400/50',
    barClass: 'bg-fuchsia-400',
    dotClass: 'bg-fuchsia-400',
    textClass: 'text-fuchsia-700 dark:text-fuchsia-300',
  },
};

export function getDefaultCustomReplacements(): Record<PIICategory, string> {
  const result = {} as Record<PIICategory, string>;
  for (const cat of CATEGORY_LIST) {
    result[cat] = CATEGORY_META[cat].defaultCustomReplacement;
  }
  return result;
}

export function getDefaultEnabledCategories(): Record<PIICategory, boolean> {
  const result = {} as Record<PIICategory, boolean>;
  for (const cat of CATEGORY_LIST) {
    result[cat] = true;
  }
  return result;
}

export interface CandidateMatch {
  type: PIICategory;
  ruleName: string;
  start: number;
  end: number;
  confidence: ConfidenceLevel;
  priority: number;
  customRuleId?: string;
  customReplacementOverride?: string;
}

function getPrecedingContext(text: string, index: number, windowSize = 48): string {
  const start = Math.max(0, index - windowSize);
  const snippet = text.slice(start, index);
  // Stop at previous newline so context stays scoped to the current line / label
  const lastNewline = snippet.lastIndexOf('\n');
  return lastNewline >= 0 ? snippet.slice(lastNewline + 1) : snippet;
}

function normalizeHint(contextHint?: string): string {
  return (contextHint ?? '').toLowerCase();
}

/**
 * Extracts all candidate PII matches from a text string before overlap resolution.
 */
export function extractBuiltInCandidates(
  text: string,
  contextHint?: string
): CandidateMatch[] {
  const candidates: CandidateMatch[] = [];
  const hint = normalizeHint(contextHint);

  // 1. URLs (http:// or https://)
  {
    const regex = /\bhttps?:\/\/[^\s<>"'`)\]},;]+/gi;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      let raw = m[0];
      // Trim trailing sentence punctuation
      while (/[.,!?:;)]$/.test(raw)) {
        raw = raw.slice(0, -1);
      }
      if (raw.length > 10) {
        candidates.push({
          type: 'URL',
          ruleName: 'HTTP/HTTPS URL Pattern',
          start: m.index,
          end: m.index + raw.length,
          confidence: 'high',
          priority: CATEGORY_META.URL.priority,
        });
      }
    }
  }

  // 2. Email addresses (requires a dot TLD after @)
  {
    const regex = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}\b/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      candidates.push({
        type: 'EMAIL',
        ruleName: 'RFC-Style Email Pattern',
        start: m.index,
        end: m.index + m[0].length,
        confidence: 'high',
        priority: CATEGORY_META.EMAIL.priority,
      });
    }
  }

  // 3. UPI IDs (no dot after @, known PSP handle or UPI context)
  {
    const regex = /\b[a-zA-Z0-9._-]{2,64}@[a-zA-Z][a-zA-Z0-9]{1,30}\b(?!\.[a-zA-Z])/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      const preceding = getPrecedingContext(text, m.index).toLowerCase();
      const hasUPIContext =
        /\b(upi|vpa|payment\s*id|bhim|gpay|phonepe|paytm)\b/.test(preceding) ||
        /\b(upi|vpa)\b/.test(hint);
      const check = validateUPI(m[0], hasUPIContext);
      if (check.valid) {
        candidates.push({
          type: 'UPI',
          ruleName: hasUPIContext ? 'Contextual UPI ID' : 'Known PSP UPI Handle',
          start: m.index,
          end: m.index + m[0].length,
          confidence: check.confidence,
          priority: CATEGORY_META.UPI.priority,
        });
      }
    }
  }

  // 4. Credit / Debit Card Numbers (Luhn-validated)
  {
    const regex = /(?<!\d)(?:\d[ -]?){13,19}(?!\d)/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      const raw = m[0].trim();
      const startOffset = m.index + m[0].indexOf(raw);
      const digits = raw.replace(/\D/g, '');
      if (digits.length < 13 || digits.length > 19) continue;
      // Avoid matching spaced dates or multiple numbers separated by extra spaces
      if (/\s{2,}/.test(raw)) continue;

      const preceding = getPrecedingContext(text, startOffset).toLowerCase();
      const hasCardContext =
        /\b(card|credit|debit|visa|mastercard|rupay|amex|cvv|pan\s*card)\b/.test(preceding) ||
        /\b(card|credit|debit)\b/.test(hint);

      if (isValidLuhn(raw) && (hasKnownCardPrefix(raw) || hasCardContext)) {
        candidates.push({
          type: 'CARD',
          ruleName: 'Luhn-Validated Payment Card',
          start: startOffset,
          end: startOffset + raw.length,
          confidence: 'high',
          priority: CATEGORY_META.CARD.priority,
        });
      }
    }
  }

  // 5. Bank Account Numbers (contextual — prioritized over Aadhaar when bank context is present)
  {
    const regex = /(?<!\d)\d{9,18}(?!\d)/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      const preceding = getPrecedingContext(text, m.index, 60).toLowerCase();
      const hasBankContext =
        /\b(bank\s*account|account\s*(?:no|num|number|#)|a\/c\s*(?:no|num|number)?|acct\s*(?:no|num|number)?|savings\s*account|current\s*account|iban)\b/.test(
          preceding
        ) || /\b(bank|account|a\/c|acct)\b/.test(hint);

      if (hasBankContext) {
        candidates.push({
          type: 'BANK_ACCOUNT',
          ruleName: 'Contextual Bank Account Number',
          start: m.index,
          end: m.index + m[0].length,
          confidence: 'high',
          priority: CATEGORY_META.BANK_ACCOUNT.priority + 2, // Higher than Aadhaar when bank context is explicit
        });
      }
    }
  }

  // 6. Aadhaar Numbers (12 digits with grouping or Aadhaar context)
  {
    const regex = /(?<!\d)(?<!\d{4}[\s-])(?:\d{4}[\s-]\d{4}[\s-]\d{4}|\d{12})(?![\s-]\d{4})(?!\d)/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      const preceding = getPrecedingContext(text, m.index, 52).toLowerCase();
      const hasBankOrCardContext =
        /\b(bank\s*account|account\s*(?:no|num|number|#)|a\/c|acct|credit\s*card|debit\s*card|card\s*(?:no|num|number)?)\b/.test(
          preceding
        ) || /\b(bank|account|a\/c|acct|card|credit|debit)\b/.test(hint);
      if (hasBankOrCardContext) continue;

      const hasAadhaarContext =
        /\b(aadhaar|aadhar|uid|uidai)\b/.test(preceding) ||
        /\b(aadhaar|aadhar|uid)\b/.test(hint);

      const check = validateAadhaar(m[0], hasAadhaarContext);
      if (check.valid) {
        candidates.push({
          type: 'AADHAAR',
          ruleName: hasAadhaarContext
            ? 'Contextual Aadhaar Pattern'
            : '12-Digit Grouped Aadhaar Pattern',
          start: m.index,
          end: m.index + m[0].length,
          confidence: check.confidence,
          priority: CATEGORY_META.AADHAAR.priority,
        });
      }
    }
  }

  // 7. PAN Numbers (ABCDE1234F)
  {
    const regex = /\b[A-Z]{5}\d{4}[A-Z]\b/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      const preceding = getPrecedingContext(text, m.index).toLowerCase();
      const hasPANContext =
        /\b(pan|permanent\s*account|tax\s*id|income\s*tax)\b/.test(preceding) ||
        /\bpan\b/.test(hint);
      const check = validatePAN(m[0], hasPANContext);
      if (check.valid) {
        candidates.push({
          type: 'PAN',
          ruleName: 'Indian PAN Identifier',
          start: m.index,
          end: m.index + m[0].length,
          confidence: check.confidence,
          priority: CATEGORY_META.PAN.priority,
        });
      }
    }
  }

  // 8. Passport Identifiers (with context)
  {
    const regex = /\b[A-Z]{1,2}\d{6,8}\b/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      const preceding = getPrecedingContext(text, m.index).toLowerCase();
      const hasPassportContext =
        /\b(passport|travel\s*doc|passport\s*(?:no|num|number|id))\b/.test(preceding) ||
        /\bpassport\b/.test(hint);
      const check = validatePassport(m[0], hasPassportContext);
      if (check.valid) {
        candidates.push({
          type: 'PASSPORT',
          ruleName: 'Contextual Passport Identifier',
          start: m.index,
          end: m.index + m[0].length,
          confidence: check.confidence,
          priority: CATEGORY_META.PASSPORT.priority,
        });
      }
    }
  }

  // 9. Indian Phone Numbers
  {
    const regex = /(?<!\d)(?:\+91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}(?!\d)/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      // Skip if immediately followed by @ (likely a UPI ID like 9876543210@paytm)
      const nextChar = text[m.index + m[0].length];
      if (nextChar === '@') continue;

      const check = validateIndianPhone(m[0]);
      if (check.valid) {
        candidates.push({
          type: 'PHONE',
          ruleName: 'Indian Mobile Number',
          start: m.index,
          end: m.index + m[0].length,
          confidence: check.confidence,
          priority: CATEGORY_META.PHONE.priority,
        });
      }
    }
  }

  // 10. IPv4 Addresses
  {
    const regex = /(?<![.\d])(?:\d{1,3}\.){3}\d{1,3}(?![.\d])/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      // Avoid version strings like v1.2.3.4
      const prevChar = m.index > 0 ? text[m.index - 1] : '';
      if (prevChar === 'v' || prevChar === 'V') continue;
      if (isValidIPv4(m[0])) {
        candidates.push({
          type: 'IP_ADDRESS',
          ruleName: 'Validated IPv4 Address',
          start: m.index,
          end: m.index + m[0].length,
          confidence: 'high',
          priority: CATEGORY_META.IP_ADDRESS.priority,
        });
      }
    }
  }

  // 11. Dates of Birth (requires DOB context or DOB CSV column)
  {
    const regex =
      /\b(?:\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/gi;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      const preceding = getPrecedingContext(text, m.index, 52).toLowerCase();
      const hasDOBContext =
        /\b(dob|d\.o\.b|date\s*of\s*birth|birth\s*date|born|birthday)\b/.test(preceding) ||
        /\b(dob|birth|born)\b/.test(hint);

      if (hasDOBContext && isValidDateString(m[0])) {
        candidates.push({
          type: 'DOB',
          ruleName: 'Contextual Date of Birth',
          start: m.index,
          end: m.index + m[0].length,
          confidence: 'high',
          priority: CATEGORY_META.DOB.priority,
        });
      }
    }
  }

  // 12. PIN Codes (Indian 6-digit postal code with context)
  {
    const regex = /(?<!\d)[1-9]\d{5}(?!\d)/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      const preceding = getPrecedingContext(text, m.index, 48).toLowerCase();
      const hasPinContext =
        /\b(pin\s*code|pincode|postal\s*code|zip\s*code|zip|pin\s*[:#-])\b/.test(preceding) ||
        /\b(pin|pincode|postal|zip)\b/.test(hint);

      if (hasPinContext && isValidIndianPinCode(m[0])) {
        candidates.push({
          type: 'PIN_CODE',
          ruleName: 'Contextual Indian PIN Code',
          start: m.index,
          end: m.index + m[0].length,
          confidence: 'high',
          priority: CATEGORY_META.PIN_CODE.priority,
        });
      }
    }
  }

  // 13. Person Names (contextual labels, honorific prefixes, or CSV name column)
  {
    // Pattern A: Labelled names ("Name: Rahul Sharma", "Customer: Priya Deshmukh", "Employee: ...")
    const labelRegex =
      /\b(?:Full\s*Name|Customer\s*Name|Client\s*Name|Employee\s*Name|Patient\s*Name|Account\s*Holder|Contact\s*Person|Applicant|Customer|Client|Name|Employee|User)\s*[:=-]\s*([A-Z][a-z]{1,24}(?:\s+[A-Z][a-z]{1,24}){0,3})/g;
    let m: RegExpExecArray | null;
    while ((m = labelRegex.exec(text)) !== null) {
      const fullMatch = m[0];
      const nameVal = m[1].trim();
      if (nameVal.length < 2) continue;
      // Avoid matching generic non-name headers
      if (/^(Information|Details|Summary|Unknown|None|Redacted)$/i.test(nameVal)) continue;
      const offsetInMatch = fullMatch.lastIndexOf(nameVal);
      const start = m.index + offsetInMatch;
      candidates.push({
        type: 'PERSON',
        ruleName: 'Contextual Labelled Name',
        start,
        end: start + nameVal.length,
        confidence: nameVal.includes(' ') ? 'high' : 'medium',
        priority: CATEGORY_META.PERSON.priority,
      });
    }

    // Pattern B: Honorific names ("Mr. Amit Patil", "Mrs. Sneha Kulkarni", "Dr. Rajesh Rao")
    const honorificRegex =
      /\b(?:Mr|Mrs|Ms|Miss|Dr|Prof|Shri|Smt)\.?\s+([A-Z][a-z]{1,24}(?:\s+[A-Z][a-z]{1,24}){1,2})\b/g;
    while ((m = honorificRegex.exec(text)) !== null) {
      const full = m[0];
      candidates.push({
        type: 'PERSON',
        ruleName: 'Honorific Name Pattern',
        start: m.index,
        end: m.index + full.length,
        confidence: 'medium',
        priority: CATEGORY_META.PERSON.priority,
      });
    }

    // Pattern C: Bare CSV cell under a Name column
    if (
      hint &&
      /\b(name|customer|client|employee|patient|person|applicant|holder|contact)\b/.test(hint) &&
      !/\b(company|city|file|product|org|organization|bank|street|road)\b/.test(hint)
    ) {
      const trimmed = text.trim();
      if (
        /^[A-Z][a-zA-Z'.-]{1,24}(?:\s+[A-Z][a-zA-Z'.-]{1,24}){0,3}$/.test(trimmed) &&
        !/^(Unknown|None|N\/A|Null|True|False)$/i.test(trimmed)
      ) {
        const start = text.indexOf(trimmed);
        candidates.push({
          type: 'PERSON',
          ruleName: 'CSV Name Column Heuristic',
          start,
          end: start + trimmed.length,
          confidence: 'medium',
          priority: CATEGORY_META.PERSON.priority,
        });
      }
    }
  }

  // 14. Physical Addresses (labelled address lines, street/apartment heuristics, or CSV address column)
  {
    // Pattern A: Explicit "Address: ..." line
    const labelledAddrRegex =
      /\b(?:Permanent\s*Address|Residential\s*Address|Home\s*Address|Billing\s*Address|Shipping\s*Address|Mailing\s*Address|Address|Addr)\s*[:=-]\s*([^\n\r]{6,140})/gi;
    let m: RegExpExecArray | null;
    while ((m = labelledAddrRegex.exec(text)) !== null) {
      const val = m[1].trim();
      if (val.length < 5) continue;
      // Do not treat an IP address line as a physical address
      const precedingLabel = m[0].slice(0, m[0].indexOf(val)).toLowerCase();
      if (/\bip\s*address\b/.test(precedingLabel)) continue;
      if (/^ip\b/.test(getPrecedingContext(text, m.index, 6).toLowerCase())) continue;

      const offsetInMatch = m[0].indexOf(val);
      const start = m.index + offsetInMatch;
      candidates.push({
        type: 'ADDRESS',
        ruleName: 'Contextual Labelled Address',
        start,
        end: start + val.length,
        confidence: 'high',
        priority: CATEGORY_META.ADDRESS.priority,
      });
    }

    // Pattern B: Inline street / flat / apartment heuristic ("Flat 4B, Green Apartments, Pune", "123 Main Street, Mumbai", "12 MG Road, Pune")
    const streetRegex =
      /\b(?:(?:Flat|Apt|Apartment|Plot|House|Room|Suite|Block|Sector|Shop|Unit)\s*(?:No\.?\s*)?[A-Z0-9/-]{1,8},?\s+[A-Za-z0-9.\s'-]{2,45}(?:Apartments?|Residency|Heights|Towers?|Enclave|Society|Complex|Villas?|Park|Colony|Nagar|Layout|Phase|Road|Rd|Street|St|Avenue|Ave|Lane|Ln|Marg|Boulevard|Blvd|Drive|Dr)|(?:\d{1,5}[A-Z]?\s+(?:[A-Za-z0-9.'-]+\s+){1,4}(?:Road|Rd|Street|St|Avenue|Ave|Lane|Ln|Marg|Cross|Main|Boulevard|Blvd|Drive|Dr|Nagar|Colony|Park|Enclave|Layout|Sector|Phase)))(?:,\s*[A-Za-z\s.-]{2,30}){0,3}/gi;
    while ((m = streetRegex.exec(text)) !== null) {
      const val = m[0].trim().replace(/[.,;]+$/, '');
      if (val.length >= 8) {
        candidates.push({
          type: 'ADDRESS',
          ruleName: 'Street / Apartment Heuristic',
          start: m.index,
          end: m.index + val.length,
          confidence: 'medium',
          priority: CATEGORY_META.ADDRESS.priority - 1,
        });
      }
    }

    // Pattern C: CSV cell under an Address column
    if (hint && /\b(address|addr|street|residence|location)\b/.test(hint) && !/\bip\b/.test(hint)) {
      const trimmed = text.trim();
      if (trimmed.length >= 6) {
        const start = text.indexOf(trimmed);
        candidates.push({
          type: 'ADDRESS',
          ruleName: 'CSV Address Column Heuristic',
          start,
          end: start + trimmed.length,
          confidence: 'medium',
          priority: CATEGORY_META.ADDRESS.priority,
        });
      }
    }
  }

  return candidates;
}
