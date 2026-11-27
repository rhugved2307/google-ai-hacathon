import { Eye, EyeOff } from 'lucide-react';
import { memo, useMemo, useState } from 'react';
import { CATEGORY_META } from '../engine/patterns';
import type { Detection, PIICategory } from '../engine/types';

interface HighlightedTextProps {
  text: string;
  detections: Detection[];
  showHighlights: boolean;
  onToggleHighlights: () => void;
  activeCategoryFilter: PIICategory | 'ALL';
  fontClass?: string;
  fontSizePx?: number;
}

interface TextSegment {
  key: string;
  content: string;
  detection?: Detection;
}

export const HighlightedText = memo(function HighlightedText({
  text,
  detections,
  showHighlights,
  onToggleHighlights,
  activeCategoryFilter,
  fontClass = 'font-serif',
  fontSizePx = 15,
}: HighlightedTextProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const visibleDetections = useMemo(() => {
    if (!showHighlights) return [];
    const filtered =
      activeCategoryFilter === 'ALL'
        ? detections
        : detections.filter((d) => d.type === activeCategoryFilter);
    return [...filtered].sort((a, b) => a.start - b.start);
  }, [detections, showHighlights, activeCategoryFilter]);

  const segments: TextSegment[] = useMemo(() => {
    if (!showHighlights || visibleDetections.length === 0) {
      return [{ key: 'plain-all', content: text }];
    }

    const result: TextSegment[] = [];
    let cursor = 0;

    for (const det of visibleDetections) {
      if (det.start < cursor || det.end > text.length || det.start >= det.end) {
        continue;
      }
      if (det.start > cursor) {
        result.push({
          key: `plain-${cursor}`,
          content: text.slice(cursor, det.start),
        });
      }
      result.push({
        key: det.id,
        content: text.slice(det.start, det.end),
        detection: det,
      });
      cursor = det.end;
    }

    if (cursor < text.length) {
      result.push({
        key: `plain-tail-${cursor}`,
        content: text.slice(cursor),
      });
    }

    return result;
  }, [text, visibleDetections, showHighlights]);

  const presentCategories = useMemo(() => {
    const set = new Set<PIICategory>();
    for (const det of detections) {
      set.add(det.type);
    }
    return Array.from(set);
  }, [detections]);

  return (
    <div className="flex h-full flex-col">
      {/* Legend & Highlight Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 bg-slate-50/70 px-5 py-2 dark:border-white/[0.06] dark:bg-[#171232]/70">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
          {presentCategories.length === 0 ? (
            <span className="text-slate-500 dark:text-[#94A3B8]">
              No sensitive categories matched.
            </span>
          ) : (
            presentCategories.map((cat) => {
              const meta = CATEGORY_META[cat];
              return (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1.5 font-medium text-slate-600 dark:text-[#A6AAB8]"
                >
                  <span className={`h-2 w-2 rounded-xs ${meta.dotClass}`} aria-hidden="true" />
                  <span>{meta.shortLabel}</span>
                </span>
              );
            })
          )}
        </div>

        <button
          type="button"
          onClick={onToggleHighlights}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:border-[#8B5CF6]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] whitespace-nowrap shrink-0 dark:border-white/[0.09] dark:bg-[#1E1A36] dark:text-[#F8FAFC] dark:hover:border-[#A78BFA]/60"
        >
          {showHighlights ? (
            <>
              <EyeOff className="h-3 w-3" aria-hidden="true" />
              <span>Hide Highlights</span>
            </>
          ) : (
            <>
              <Eye className="h-3 w-3" aria-hidden="true" />
              <span>Show Highlights</span>
            </>
          )}
        </button>
      </div>

      {/* Text Content */}
      <div
        className={`relative flex-1 overflow-auto px-6 py-5 leading-7 text-slate-800 whitespace-pre-wrap break-words dark:text-[#F1F5F9] ${fontClass}`}
        style={{ fontSize: `${fontSizePx}px` }}
      >
        {segments.map((seg) => {
          if (!seg.detection) {
            return <span key={seg.key}>{seg.content}</span>;
          }

          const det = seg.detection;
          const meta = CATEGORY_META[det.type];
          const isHovered = hoveredId === det.id;

          return (
            <span
              key={seg.key}
              tabIndex={0}
              aria-label={`${meta.label}: ${seg.content}, redacted as ${det.replacement}`}
              onMouseEnter={() => setHoveredId(det.id)}
              onMouseLeave={() => setHoveredId((curr) => (curr === det.id ? null : curr))}
              onFocus={() => setHoveredId(det.id)}
              onBlur={() => setHoveredId((curr) => (curr === det.id ? null : curr))}
              className={`relative inline-flex items-baseline gap-1 cursor-help rounded-md border px-1 py-0.5 leading-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] ${meta.highlightLight} ${meta.highlightDark}`}
            >
              <span>{seg.content}</span>
              <span
                aria-hidden="true"
                className="select-none rounded px-1 py-px font-mono text-[9px] font-bold uppercase tracking-wider opacity-80 ring-1 ring-current/25"
              >
                {meta.shortLabel}
              </span>
              {isHovered && (
                <span
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full left-0 z-30 mb-2 w-64 rounded-xl border border-slate-200 bg-white p-3 font-sans text-left text-xs text-slate-900 shadow-2xl dark:border-white/[0.12] dark:bg-[#131318] dark:text-[#F8FAFC]"
                >
                  <span className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5 dark:border-white/[0.08]">
                    <span className={`font-semibold ${meta.textClass}`}>{meta.label}</span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                      {det.confidence}
                    </span>
                  </span>
                  <span className="mt-1.5 block space-y-1 text-[11px] text-slate-600 dark:text-[#94A3B8]">
                    <span className="flex justify-between gap-2">
                      <span>Rule</span>
                      <span className="truncate font-medium text-slate-800 dark:text-[#F8FAFC]">
                        {det.ruleName}
                      </span>
                    </span>
                    <span className="flex justify-between gap-2">
                      <span>Output</span>
                      <span className="font-mono font-semibold text-emerald-700 dark:text-[#34D399]">
                        {det.replacement}
                      </span>
                    </span>
                    <span className="flex justify-between gap-2">
                      <span>Label</span>
                      <span className="font-mono text-slate-800 dark:text-[#A78BFA]">
                        {det.redactionLabel}
                      </span>
                    </span>
                  </span>
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
});
