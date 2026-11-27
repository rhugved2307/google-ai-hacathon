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
  for (const rule of rules) {
    if (!rule.enabled || !rule.pattern.trim()) continue;
    try {
      const safeFlags = Array.from(new Set((rule.flags + 'g').replace(/[^gimsu]/g, ''))).join('');
      const regex = new RegExp(rule.pattern, safeFlags);
      let m: RegExpExecArray | null;
      let guard = 0;
      const MAX_MATCHES = 5000;
      while ((m = regex.exec(text)) !== null && guard < MAX_MATCHES) {
        guard += 1;
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
 */
function resolveOverlaps(candidates: CandidateMatch[]): CandidateMatch[] {
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
  for (const candidate of ranked) {
    if (candidate.start >= candidate.end) continue;
    let overlaps = false;
    for (const existing of accepted) {
      if (candidate.start < existing.end && candidate.end > existing.start) {
        overlaps = true;
        break;
      }
    }
    if (!overlaps) {
      accepted.push(candidate);
    }
  }

  return accepted.sort((a, b) => a.start - b.start);
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

  const builtIn = extractBuiltInCandidates(text, options.contextHint);
  const custom = options.enabledCategories.CUSTOM
    ? extractCustomRuleCandidates(text, options.customRules)
    : [];

  // Filter by enabled categories before resolving overlaps
  const enabledCandidates = [...builtIn, ...custom].filter(
    (c) => options.enabledCategories[c.type] !== false
  );

  const resolved = resolveOverlaps(enabledCandidates);
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
