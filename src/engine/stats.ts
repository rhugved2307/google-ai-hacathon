import { CATEGORY_LIST, CATEGORY_META } from './patterns';
import type { CategoryStat, PIICategory } from './types';

/**
 * Computes sorted per-category detection statistics from a category count map.
 * Shared across plain-text and CSV scanning engines to prevent logic drift.
 */
export function buildCategoryStats(
  countsByCategory: Partial<Record<PIICategory, number>>,
  totalDetections: number
): CategoryStat[] {
  const stats: CategoryStat[] = [];

  for (const category of CATEGORY_LIST) {
    const count = countsByCategory[category] ?? 0;
    if (count > 0) {
      stats.push({
        category,
        label: CATEGORY_META[category].label,
        count,
        percentage: totalDetections > 0 ? Math.round((count / totalDetections) * 1000) / 10 : 0,
      });
    }
  }

  return stats.sort((a, b) => b.count - a.count);
}
