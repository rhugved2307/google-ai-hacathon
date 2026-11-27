import type { PIICategory, RedactionMode } from './types';

function maskMiddle(value: string, keepStart: number, keepEnd: number): string {
  const safeStart = Math.max(0, keepStart);
  const safeEnd = Math.max(0, keepEnd);
  if (!value) return '***';
  if (value.length <= safeStart + safeEnd) {
    return '*'.repeat(Math.max(value.length, 3));
  }
  const start = value.slice(0, safeStart);
  const end = safeEnd > 0 ? value.slice(value.length - safeEnd) : '';
  const maskedLen = value.length - safeStart - safeEnd;
  return `${start}${'*'.repeat(maskedLen)}${end}`;
}

function maskHandleAtDomain(value: string): string {
  const atIdx = value.indexOf('@');
  if (atIdx <= 0) return maskMiddle(value, 1, 2);
  const handle = value.slice(0, atIdx);
  const domain = value.slice(atIdx);
  const maskedHandle =
    handle.length <= 1 ? '*' : `${handle[0]}${'*'.repeat(Math.max(handle.length - 1, 3))}`;
  return `${maskedHandle}${domain}`;
}

function maskKeepLastDigits(value: string, keepLast = 4, maskChar = '*'): string {
  const totalDigits = value.replace(/\D/g, '').length;
  if (totalDigits === 0) return maskMiddle(value, 1, 1);
  let digitsSeen = 0;
  return value.replace(/\d/g, (digit) => {
    digitsSeen += 1;
    return digitsSeen <= totalDigits - keepLast ? maskChar : digit;
  });
}

export function partialMaskValue(raw: string, category: PIICategory): string {
  const value = raw.trim();
  if (!value) return `[${category}]`;

  switch (category) {
    case 'EMAIL':
    case 'UPI':
      return maskHandleAtDomain(value);

    case 'PHONE': {
      // Preserve +91 / 0 prefix if present, mask digits except last 4
      const prefixMatch = /^(\+91[\s-]?|0)/.exec(value);
      const prefix = prefixMatch ? prefixMatch[1] : '';
      const rest = value.slice(prefix.length);
      return `${prefix}${maskKeepLastDigits(rest, 4, '*')}`;
    }

    case 'PAN': {
      // Matches specification example: ABCDE1234F -> AB***34*F
      if (value.length === 10) {
        return `${value.slice(0, 2)}***${value.slice(7, 9)}*${value.slice(9)}`;
      }
      return maskMiddle(value, 2, 1);
    }

    case 'AADHAAR': {
      // Mask first 8 digits while keeping separators and last 4 digits
      let digitsSeen = 0;
      return value.replace(/\d/g, (digit) => {
        digitsSeen += 1;
        return digitsSeen <= 8 ? 'X' : digit;
      });
    }

    case 'CARD':
    case 'BANK_ACCOUNT':
      return maskKeepLastDigits(value, 4, '*');

    case 'IP_ADDRESS': {
      const parts = value.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.***.***.${parts[3]}`;
      }
      return maskMiddle(value, 3, 2);
    }

    case 'URL': {
      try {
        const parsed = new URL(value);
        const host = parsed.hostname;
        const dotIdx = host.lastIndexOf('.');
        const maskedHost =
          dotIdx > 1
            ? `${host[0]}${'*'.repeat(Math.min(dotIdx - 1, 6))}${host.slice(dotIdx)}`
            : maskMiddle(host, 1, 1);
        const pathSuffix = parsed.pathname && parsed.pathname !== '/' ? '/***' : '';
        return `${parsed.protocol}//${maskedHost}${pathSuffix}`;
      } catch {
        return maskMiddle(value, 8, 3);
      }
    }

    case 'DOB': {
      // Keep only the year if 4-digit year exists
      const yearMatch = /\b(19|20)\d{2}\b/.exec(value);
      if (yearMatch) {
        const yStart = yearMatch.index;
        const yEnd = yStart + 4;
        return value.replace(/\d/g, (ch, offset: number) =>
          offset >= yStart && offset < yEnd ? ch : '*'
        );
      }
      return maskMiddle(value, 0, 4);
    }

    case 'PERSON': {
      return value
        .split(/\s+/)
        .map((word) => {
          if (/^(Mr|Mrs|Ms|Miss|Dr|Prof|Shri|Smt)\.?$/i.test(word)) return word;
          if (word.length <= 1) return '*';
          return `${word[0]}${'*'.repeat(Math.max(word.length - 1, 3))}`;
        })
        .join(' ');
    }

    case 'ADDRESS': {
      const parts = value.split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        const maskedParts = parts.map((part, idx) => {
          if (idx === parts.length - 1) {
            // Keep first 2 characters of last locality token
            return part.length > 2
              ? `${part.slice(0, 2)}${'*'.repeat(Math.min(part.length - 2, 5))}`
              : '***';
          }
          return part.replace(/[A-Za-z0-9]/g, '*');
        });
        return maskedParts.join(', ');
      }
      return maskMiddle(value, 2, 2);
    }

    case 'PASSPORT':
      return maskMiddle(value, 1, 2);

    case 'PIN_CODE':
      return value.length === 6
        ? `${value.slice(0, 2)}***${value.slice(5)}`
        : maskMiddle(value, 2, 1);

    case 'CUSTOM':
    default:
      return maskMiddle(value, 1, 1);
  }
}

export function buildReplacement(
  rawValue: string,
  category: PIICategory,
  mode: RedactionMode,
  customReplacements: Record<PIICategory, string>,
  customRuleReplacement?: string
): string {
  const safeCustomRule = customRuleReplacement?.trim();

  if (mode === 'full') {
    if (category === 'CUSTOM' && safeCustomRule) {
      return safeCustomRule;
    }
    return `[${category}]`;
  }
  if (mode === 'partial') {
    return partialMaskValue(rawValue, category);
  }
  // Custom replacement mode
  if (category === 'CUSTOM' && safeCustomRule) {
    return safeCustomRule;
  }
  const configured = customReplacements[category]?.trim();
  return configured ? configured : `[${category}]`;
}
