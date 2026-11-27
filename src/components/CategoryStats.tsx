import {
  Building2,
  Calendar,
  CreditCard,
  Fingerprint,
  Globe,
  Hash,
  IdCard,
  Landmark,
  Link2,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  User,
  Wallet,
} from 'lucide-react';
import { CATEGORY_META } from '../engine/patterns';
import type { CategoryStat, PIICategory } from '../engine/types';

export function getCategoryIcon(category: PIICategory) {
  switch (category) {
    case 'EMAIL':
      return Mail;
    case 'PHONE':
      return Phone;
    case 'AADHAAR':
      return Fingerprint;
    case 'PAN':
      return IdCard;
    case 'CARD':
      return CreditCard;
    case 'UPI':
      return Wallet;
    case 'IP_ADDRESS':
      return Globe;
    case 'URL':
      return Link2;
    case 'DOB':
      return Calendar;
    case 'PERSON':
      return User;
    case 'ADDRESS':
      return MapPin;
    case 'PASSPORT':
      return Building2;
    case 'BANK_ACCOUNT':
      return Landmark;
    case 'PIN_CODE':
      return Hash;
    case 'CUSTOM':
    default:
      return Sparkles;
  }
}

interface CategoryStatsProps {
  stats: CategoryStat[];
  activeFilter: PIICategory | 'ALL';
  onSelectFilter: (category: PIICategory | 'ALL') => void;
}

export function CategoryStats({
  stats,
  activeFilter,
  onSelectFilter,
}: CategoryStatsProps) {
  return (
    <div className="rounded-[22px] border border-stone-200 bg-white p-5 dark:border-[#242627] dark:bg-[#161718]">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-stone-900 dark:text-[#F4F5F5]">
            Category Breakdown
          </h3>
          <p className="text-xs text-stone-500 dark:text-[#8B8E90]">
            Click a category to filter detections and highlights
          </p>
        </div>

        {activeFilter !== 'ALL' && (
          <button
            type="button"
            onClick={() => onSelectFilter('ALL')}
            className="text-xs font-semibold text-stone-900 hover:underline dark:text-[#EBF8A4]"
          >
            Show all
          </button>
        )}
      </div>

      {stats.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-200 py-8 text-center text-xs text-stone-500 dark:border-[#292B2D] dark:text-[#8B8E90]">
          No sensitive data categories detected in the scanned content.
        </div>
      ) : (
        <div className="space-y-2.5">
          {stats.map((item) => {
            const meta = CATEGORY_META[item.category];
            const Icon = getCategoryIcon(item.category);
            const isSelected = activeFilter === item.category;

            return (
              <button
                key={item.category}
                type="button"
                onClick={() => onSelectFilter(isSelected ? 'ALL' : item.category)}
                aria-pressed={isSelected}
                className={`block w-full rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EBF8A4] ${
                  isSelected
                    ? 'border-stone-900 bg-stone-100 dark:border-[#EBF8A4]/60 dark:bg-[#222426]'
                    : 'border-stone-200 bg-stone-50/60 hover:border-stone-300 dark:border-[#26282A] dark:bg-[#1B1D1E] dark:hover:border-[#34373A]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-stone-200 dark:bg-[#252729] dark:ring-[#303336]"
                      style={{ color: meta.accentHex }}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-stone-900 dark:text-[#F4F5F5]">
                        {meta.shortLabel}
                        <span className="ml-1.5 font-normal text-stone-500 dark:text-[#8B8E90]">
                          · {meta.label}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2 shrink-0 font-mono text-xs tabular-nums">
                    <span className="font-semibold text-stone-900 dark:text-[#F4F5F5]">
                      {item.count}
                    </span>
                    <span className="text-[11px] text-stone-500 dark:text-[#8B8E90]">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-[#26282A]">
                  <div
                    className={`h-full rounded-full transition-all duration-200 ${meta.barClass}`}
                    style={{ width: `${Math.max(item.percentage, 4)}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
