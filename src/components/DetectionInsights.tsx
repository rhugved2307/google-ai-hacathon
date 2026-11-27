import { Filter, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CATEGORY_META } from '../engine/patterns';
import type { ConfidenceLevel, PIICategory, ScanResult } from '../engine/types';
import { getCategoryIcon } from './CategoryStats';

interface DetectionInsightsProps {
  scanResult: ScanResult;
  activeCategoryFilter: PIICategory | 'ALL';
  onSelectCategoryFilter: (cat: PIICategory | 'ALL') => void;
  isCSVMode: boolean;
}

export function DetectionInsights({
  scanResult,
  activeCategoryFilter,
  onSelectCategoryFilter,
  isCSVMode,
}: DetectionInsightsProps) {
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceLevel | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { categoryStats, detections } = scanResult;

  const filteredDetections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return detections.filter((d) => {
      if (activeCategoryFilter !== 'ALL' && d.type !== activeCategoryFilter) return false;
      if (confidenceFilter !== 'all' && d.confidence !== confidenceFilter) return false;
      if (q) {
        const meta = CATEGORY_META[d.type];
        return (
          meta.shortLabel.toLowerCase().includes(q) ||
          meta.label.toLowerCase().includes(q) ||
          d.ruleName.toLowerCase().includes(q) ||
          d.replacement.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [detections, activeCategoryFilter, confidenceFilter, searchQuery]);

  return (
    <section aria-label="Detection insights" className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* Left: Category Breakdown with Icons & Horizontal Progress Bars */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-5 dark:border-[#283449] dark:bg-[#141B2D]">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">
              Detection Insights
            </h2>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              Select any category to filter highlights and audit rows
            </p>
          </div>

          {activeCategoryFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => onSelectCategoryFilter('ALL')}
              className="text-xs font-semibold text-[#7C3AED] hover:underline dark:text-[#A78BFA]"
            >
              Reset
            </button>
          )}
        </div>

        {categoryStats.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-xs text-slate-500 dark:border-[#283449] dark:text-[#94A3B8]">
            No sensitive patterns were matched in this input.
          </div>
        ) : (
          <div className="space-y-2.5">
            {categoryStats.map((stat) => {
              const meta = CATEGORY_META[stat.category];
              const Icon = getCategoryIcon(stat.category);
              const selected = activeCategoryFilter === stat.category;

              return (
                <button
                  key={stat.category}
                  type="button"
                  onClick={() => onSelectCategoryFilter(selected ? 'ALL' : stat.category)}
                  aria-pressed={selected}
                  className={`block w-full rounded-xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] ${
                    selected
                      ? 'border-[#8B5CF6] bg-[#8B5CF6]/10 dark:border-[#A78BFA] dark:bg-[#1B2540]'
                      : 'border-slate-200/80 bg-slate-50/50 hover:border-slate-300 dark:border-[#283449] dark:bg-[#0F1629] dark:hover:border-[#3A4B69]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-slate-200 dark:bg-[#1B2540] dark:ring-[#283449]"
                        style={{ color: meta.accentHex }}
                      >
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-900 dark:text-[#F8FAFC]">
                          {meta.shortLabel}
                          <span className="ml-1.5 font-normal text-slate-500 dark:text-[#94A3B8]">
                            · {meta.label}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-baseline gap-2 shrink-0 font-mono text-xs tabular-nums">
                      <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                        {stat.count}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
                        {stat.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-[#1B2540]">
                    <div
                      className={`h-full rounded-full transition-all duration-200 ${meta.barClass}`}
                      style={{ width: `${Math.max(stat.percentage, 4)}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right: Filterable Privacy-Safe Audit Log */}
      <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-7 dark:border-[#283449] dark:bg-[#141B2D]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">
              Audit Log
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              Privacy-safe metadata only — raw sensitive values are never displayed
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search rule or type..."
                aria-label="Search audit log"
                className="h-8 w-40 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#8B5CF6] focus:outline-none dark:border-[#283449] dark:bg-[#0F1629] dark:text-[#F8FAFC] dark:placeholder:text-[#64748B]"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              <select
                aria-label="Filter by confidence"
                value={confidenceFilter}
                onChange={(e) => setConfidenceFilter(e.target.value as ConfidenceLevel | 'all')}
                className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-700 focus:border-[#8B5CF6] focus:outline-none dark:border-[#283449] dark:bg-[#0F1629] dark:text-[#F8FAFC]"
              >
                <option value="all">All Confidence</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="max-h-[380px] flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-[#283449]">
          {filteredDetections.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 dark:text-[#94A3B8]">
              {detections.length === 0
                ? 'Zero detections logged.'
                : 'No detections match your current filter.'}
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-[11px] font-semibold text-slate-600 dark:bg-[#1B2540] dark:text-[#94A3B8]">
                <tr className="border-b border-slate-200 dark:border-[#283449]">
                  <th className="px-3.5 py-2.5">Category</th>
                  <th className="px-3.5 py-2.5">Detection Rule</th>
                  <th className="px-3.5 py-2.5">{isCSVMode ? 'Row / Col' : 'Position'}</th>
                  <th className="px-3.5 py-2.5">Sanitized Label</th>
                  <th className="px-3.5 py-2.5 text-right">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-[#283449]/70">
                {filteredDetections.slice(0, 250).map((det) => {
                  const meta = CATEGORY_META[det.type];
                  const confColor =
                    det.confidence === 'high'
                      ? 'text-emerald-700 dark:text-[#34D399]'
                      : det.confidence === 'medium'
                        ? 'text-amber-700 dark:text-[#F59E0B]'
                        : 'text-slate-500 dark:text-[#94A3B8]';

                  return (
                    <tr
                      key={det.id}
                      className="transition-colors hover:bg-slate-50 dark:hover:bg-[#1B2540]/60"
                    >
                      <td className="px-3.5 py-2.5 font-mono font-semibold whitespace-nowrap">
                        <span className={meta.textClass}>{meta.shortLabel}</span>
                      </td>
                      <td className="max-w-[180px] truncate px-3.5 py-2.5 text-slate-700 dark:text-[#F8FAFC]">
                        {det.ruleName}
                      </td>
                      <td className="px-3.5 py-2.5 font-mono tabular-nums text-slate-500 whitespace-nowrap dark:text-[#94A3B8]">
                        {isCSVMode ? `R${det.line}:C${det.column}` : `L${det.line}:${det.column}`} ·{' '}
                        {det.originalLength}ch
                      </td>
                      <td className="max-w-[170px] truncate px-3.5 py-2.5 font-mono font-medium text-emerald-700 dark:text-[#34D399]">
                        {det.replacement}
                      </td>
                      <td
                        className={`px-3.5 py-2.5 text-right font-medium capitalize whitespace-nowrap ${confColor}`}
                      >
                        {det.confidence}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {filteredDetections.length > 250 && (
          <p className="mt-2 text-right text-[11px] text-slate-500 dark:text-[#94A3B8]">
            Showing first 250 of {filteredDetections.length.toLocaleString()} items.
          </p>
        )}
      </div>
    </section>
  );
}
