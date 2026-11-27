import type { PIICategory, RedactionMode } from './types';

function maskMiddle(value: string, keepStart: number, keepEnd: number): string {
  if (value.length <= keepStart + keepEnd) {
    return '*'.repeat(Math.max(value.length, 3));
  }
  const start = value.slice(0, keepStart);
  const end = keepEnd > 0 ? value.slice(value.length - keepEnd) : '';
  const maskedLen = value.length - keepStart - keepEnd;
  return `${start}${'*'.repeat(maskedLen)}${end}`;
}

export function partialMaskValue(raw: string, category: PIICategory): string {
  const value = raw.trim();

  switch (category) {
    case 'EMAIL': {
      const atIdx = value.indexOf('@');
      if (atIdx <= 0) return maskMiddle(value, 1, 2);
      const local = value.slice(0, atIdx);
      const domain = value.slice(atIdx);
      const maskedLocal =
        local.length <= 1 ? '*' : `${local[0]}${'*'.repeat(Math.max(local.length - 1, 3))}`;
      return `${maskedLocal}${domain}`;
    }

    case 'UPI': {
      const atIdx = value.indexOf('@');
      if (atIdx <= 0) return maskMiddle(value, 1, 2);
      const user = value.slice(0, atIdx);
      const psp = value.slice(atIdx);
      const maskedUser =
        user.length <= 1 ? '*' : `${user[0]}${'*'.repeat(Math.max(user.length - 1, 3))}`;
      return `${maskedUser}${psp}`;
    }

    case 'PHONE': {
      // Preserve +91 prefix if present, mask digits except last 4
      const prefixMatch = /^(\+91[\s-]?|0)/.exec(value);
      const prefix = prefixMatch ? prefixMatch[1] : '';
      const rest = value.slice(prefix.length);
      let digitsSeen = 0;
      const totalDigits = rest.replace(/\D/g, '').length;
      const maskedRest = rest.replace(/\d/g, (digit) => {
        digitsSeen += 1;
        return digitsSeen <= totalDigits - 4 ? '*' : digit;
      });
      return `${prefix}${maskedRest}`;
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

    case 'CARD': {
      const totalDigits = value.replace(/\D/g, '').length;
      let digitsSeen = 0;
      return value.replace(/\d/g, (digit) => {
        digitsSeen += 1;
        return digitsSeen <= totalDigits - 4 ? '*' : digit;
      });
    }

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
        return value.replace(/\d/g, (ch, offset) => {
          const yStart = yearMatch.index;
          const yEnd = yStart + 4;
          return offset >= yStart && offset < yEnd ? ch : '*';
        });
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
            return part.length > 2 ? `${part.slice(0, 2)}${'*'.repeat(Math.min(part.length - 2, 5))}` : '***';
          }
          return part.replace(/[A-Za-z0-9]/g, '*');
        });
        return maskedParts.join(', ');
      }
      return maskMiddle(value, 2, 2);
    }

    case 'PASSPORT': {
      return maskMiddle(value, 1, 2);
    }

    case 'BANK_ACCOUNT': {
      const totalDigits = value.replace(/\D/g, '').length;
      let digitsSeen = 0;
      return value.replace(/\d/g, (digit) => {
        digitsSeen += 1;
        return digitsSeen <= totalDigits - 4 ? '*' : digit;
      });
    }

    case 'PIN_CODE': {
      return value.length === 6 ? `${value.slice(0, 2)}***${value.slice(5)}` : maskMiddle(value, 2, 1);
    }

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
  if (mode === 'full') {
    if (category === 'CUSTOM' && customRuleReplacement) {
      return customRuleReplacement;
    }
    return `[${category}]`;
  }
  if (mode === 'partial') {
    return partialMaskValue(rawValue, category);
  }
  // Custom replacement mode
  if (category === 'CUSTOM' && customRuleReplacement) {
    return customRuleReplacement;
  }
  const configured = customReplacements[category]?.trim();
  return configured ? configured : `[${category}]`;
}
