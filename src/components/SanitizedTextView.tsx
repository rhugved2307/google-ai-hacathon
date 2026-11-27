import { memo, useMemo } from 'react';
import type { Detection, PIICategory } from '../engine/types';

interface SanitizedTextViewProps {
  rawText: string;
  sanitizedText: string;
  detections: Detection[];
  isCSVMode: boolean;
  activeCategoryFilter: PIICategory | 'ALL';
  fontClass?: string;
  fontSizePx?: number;
}

interface SanitizedSegment {
  key: string;
  content: string;
  isRedacted: boolean;
  category?: PIICategory;
}

/**
 * Renders sanitized output safely using React text nodes, highlighting emerald-teal redaction labels.
 */
export const SanitizedTextView = memo(function SanitizedTextView({
  rawText,
  sanitizedText,
  detections,
  isCSVMode,
  activeCategoryFilter,
  fontClass = 'font-mono',
  fontSizePx = 13,
}: SanitizedTextViewProps) {
  const segments: SanitizedSegment[] = useMemo(() => {
    if (!sanitizedText) return [];

    // For plain text mode, reconstruct exact non-overlapping segments directly from rawText + detections
    if (!isCSVMode && detections.length > 0) {
      const sorted = [...detections].sort((a, b) => a.start - b.start);
      const out: SanitizedSegment[] = [];
      let cursor = 0;

      for (const det of sorted) {
        if (det.start < cursor || det.end > rawText.length) continue;
        if (det.start > cursor) {
          out.push({
            key: `plain-${cursor}`,
            content: rawText.slice(cursor, det.start),
            isRedacted: false,
          });
        }
        const emphasized =
          activeCategoryFilter === 'ALL' || activeCategoryFilter === det.type;
        out.push({
          key: `red-${det.id}`,
          content: det.replacement,
          isRedacted: emphasized,
          category: det.type,
        });
        cursor = det.end;
      }

      if (cursor < rawText.length) {
        out.push({
          key: `plain-tail-${cursor}`,
          content: rawText.slice(cursor),
          isRedacted: false,
        });
      }
      return out;
    }

    // For CSV mode, highlight bracketed redaction tokens or masked tokens safely via regex split
    const uniqueTokens = Array.from(
      new Set(
        detections
          .filter((d) => activeCategoryFilter === 'ALL' || d.type === activeCategoryFilter)
          .map((d) => d.replacement)
          .filter((t) => t.length > 0)
      )
    ).sort((a, b) => b.length - a.length);

    if (uniqueTokens.length === 0) {
      return [{ key: 'all-plain', content: sanitizedText, isRedacted: false }];
    }

    const escaped = uniqueTokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const matcher = new RegExp(`(${escaped.join('|')})`, 'g');
    const parts = sanitizedText.split(matcher);
    const tokenSet = new Set(uniqueTokens);

    return parts
      .filter((p) => p.length > 0)
      .map((part, idx) => ({
        key: `csv-seg-${idx}`,
        content: part,
        isRedacted: tokenSet.has(part),
      }));
  }, [rawText, sanitizedText, detections, isCSVMode, activeCategoryFilter]);

  return (
    <div
      className={`min-h-full p-5 leading-[2.1] text-slate-800 whitespace-pre-wrap break-words dark:text-[#E2E8F0] ${fontClass}`}
      style={{ fontSize: `${fontSizePx}px` }}
    >
      {segments.map((seg) =>
        seg.isRedacted ? (
          <span
            key={seg.key}
            className="inline box-decoration-clone rounded-md border border-emerald-500/30 bg-emerald-500/12 px-1.5 py-[2px] font-mono font-semibold text-emerald-800 dark:border-[#34D399]/35 dark:bg-[#34D399]/14 dark:text-[#34D399]"
          >
            {seg.content}
          </span>
        ) : (
          <span key={seg.key}>{seg.content}</span>
        )
      )}
    </div>
  );
});
