import {
  CATEGORY_META,
  extractBuiltInCandidates,
  type CandidateMatch,
} from './patterns';
import { buildReplacement } from './redactor';
import type {
  CategoryStat,
  ConfidenceLevel,
  CustomRule,
  Detection,
  PIICategory,
  ScanOptions,
  ScanResult,
} from './types';
import { validateCustomRegexPattern } from './validators';

const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

function computeLineStarts(text: string): number[] {
  const starts = [0];
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) === 10) {
      starts.push(i + 1);
    }
  }
  return starts;
}

function getLineAndColumn(lineStarts: number[], offset: number): { line: number; column: number } {
  let lo = 0;
  let hi = lineStarts.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lineStarts[mid] <= offset) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  const lineIndex = Math.max(0, hi);
  return {
    line: lineIndex + 1,
    column: offset - lineStarts[lineIndex] + 1,
  };
}

function extractCustomRuleCandidates(text: string, rules: CustomRule[]): CandidateMatch[] {
  const candidates: CandidateMatch[] = [];
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  for (const rule of rules) {
    if (!rule.enabled || !rule.pattern.trim()) continue;
    const validation = validateCustomRegexPattern(rule.pattern, rule.flags);
    if (!validation.valid) continue;

    try {
      const regex = new RegExp(rule.pattern, validation.safeFlags);
      let m: RegExpExecArray | null;
      let guard = 0;
      const MAX_MATCHES = 5000;
      const MAX_RULE_MS = 50;
      const startTime = now();

      while ((m = regex.exec(text)) !== null && guard < MAX_MATCHES) {
        guard += 1;
        if ((guard & 63) === 0 && now() - startTime > MAX_RULE_MS) {
          break;
        }
        if (m[0].length === 0) {
          regex.lastIndex += 1;
          continue;
        }
        candidates.push({
          type: 'CUSTOM',
          ruleName: rule.name || 'Custom Pattern',
          start: m.index,
          end: m.index + m[0].length,
          confidence: rule.confidence,
          priority: CATEGORY_META.CUSTOM.priority,
          customRuleId: rule.id,
          customReplacementOverride: rule.replacement || '[CUSTOM REDACTED]',
        });
      }
    } catch {
      // Ignore malformed regex gracefully; UI validates patterns before adding.
    }
  }
  return candidates;
}

/**
 * Resolves overlapping candidate intervals using specificity priority, span length, and confidence.
 * Uses a Uint8Array occupancy map for O(N log N + matchedChars) resolution without quadratic blowup,
 * falling back to binary-searched interval insertion for multi-megabyte strings.
 */
function resolveOverlaps(candidates: CandidateMatch[], textLength: number): CandidateMatch[] {
  if (candidates.length <= 1) return candidates;

  const ranked = [...candidates].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    const lenDiff = b.end - b.start - (a.end - a.start);
    if (lenDiff !== 0) return lenDiff;
    const confDiff = CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence];
    if (confDiff !== 0) return confDiff;
    return a.start - b.start;
  });

  const accepted: CandidateMatch[] = [];

  if (textLength > 0 && textLength <= 2_000_000) {
    const occupied = new Uint8Array(textLength);
    for (const candidate of ranked) {
      if (candidate.start >= candidate.end || candidate.start < 0 || candidate.end > textLength) {
        continue;
      }
      let overlaps = false;
      for (let i = candidate.start; i < candidate.end; i++) {
        if (occupied[i] !== 0) {
          overlaps = true;
          break;
        }
      }
      if (!overlaps) {
        occupied.fill(1, candidate.start, candidate.end);
        accepted.push(candidate);
      }
    }
    return accepted.sort((a, b) => a.start - b.start);
  }

  // Fallback for very large texts (> 2M chars): maintain accepted sorted by start via binary search
  for (const candidate of ranked) {
    if (candidate.start >= candidate.end) continue;
    let lo = 0;
    let hi = accepted.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (accepted[mid].start < candidate.start) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    const prev = lo > 0 ? accepted[lo - 1] : null;
    const next = lo < accepted.length ? accepted[lo] : null;
    if (prev && prev.end > candidate.start) continue;
    if (next && next.start < candidate.end) continue;
    accepted.splice(lo, 0, candidate);
  }

  return accepted;
}

/**
 * Main PII detection and redaction pipeline.
 * Never logs or persists user input; detection objects store offsets and metadata only.
 */
export function scanAndSanitizeText(text: string, options: ScanOptions): ScanResult {
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();

  if (!text) {
    return {
      detections: [],
      sanitizedText: '',
      stats: {
        totalDetections: 0,
        uniqueCategories: 0,
        totalRedactions: 0,
        charactersSanitized: 0,
        scanDurationMs: 0,
      },
      categoryStats: [],
    };
  }

  const builtIn = extractBuiltInCandidates(
    text,
    options.contextHint,
    options.enabledCategories
  );
  const custom =
    options.enabledCategories.CUSTOM !== false && options.customRules.length > 0
      ? extractCustomRuleCandidates(text, options.customRules)
      : [];

  const enabledCandidates = custom.length > 0 ? [...builtIn, ...custom] : builtIn;

  const resolved = resolveOverlaps(enabledCandidates, text.length);
  const lineStarts = computeLineStarts(text);

  const detections: Detection[] = [];
  const countsByCategory: Partial<Record<PIICategory, number>> = {};
  let charactersSanitized = 0;

  // Build sanitized text in one linear pass over non-overlapping sorted spans
  const chunks: string[] = [];
  let cursor = 0;

  for (let i = 0; i < resolved.length; i++) {
    const item = resolved[i];
    const rawSlice = text.slice(item.start, item.end);
    const replacement = buildReplacement(
      rawSlice,
      item.type,
      options.redactionMode,
      options.customReplacements,
      item.customReplacementOverride
    );
    const { line, column } = getLineAndColumn(lineStarts, item.start);

    chunks.push(text.slice(cursor, item.start));
    chunks.push(replacement);
    cursor = item.end;

    const originalLength = item.end - item.start;
    charactersSanitized += originalLength;
    countsByCategory[item.type] = (countsByCategory[item.type] ?? 0) + 1;

    detections.push({
      id: `det-${i + 1}-${item.type}-${item.start}`,
      type: item.type,
      ruleName: item.ruleName,
      start: item.start,
      end: item.end,
      originalLength,
      replacement,
      redactionLabel:
        item.type === 'CUSTOM' && item.customReplacementOverride
          ? item.customReplacementOverride
          : `[${item.type}]`,
      confidence: item.confidence,
      line,
      column,
      customRuleId: item.customRuleId,
    });
  }

  chunks.push(text.slice(cursor));
  const sanitizedText = chunks.join('');

  const totalDetections = detections.length;
  const categoryStats: CategoryStat[] = (Object.entries(countsByCategory) as [PIICategory, number][])
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
    detections,
    sanitizedText,
    stats: {
      totalDetections,
      uniqueCategories: categoryStats.length,
      totalRedactions: totalDetections,
      charactersSanitized,
      scanDurationMs: Math.max(0, Math.round((t1 - t0) * 10) / 10),
    },
    categoryStats,
  };
}
