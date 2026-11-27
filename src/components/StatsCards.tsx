import { Layers, Lock, ScanSearch, ShieldCheck } from 'lucide-react';
import type { RedactionMode, ScanResult } from '../engine/types';

interface StatsCardsProps {
  hasScanned: boolean;
  scanResult: ScanResult | null;
  redactionMode: RedactionMode;
}

export function StatsCards({ hasScanned, scanResult, redactionMode }: StatsCardsProps) {
  const totalFindings = scanResult?.stats.totalDetections ?? 0;
  const uniqueCategories = scanResult?.stats.uniqueCategories ?? 0;
  const totalRedactions = scanResult?.stats.totalRedactions ?? 0;
  const charsSanitized = scanResult?.stats.charactersSanitized ?? 0;
  const durationMs = scanResult?.stats.scanDurationMs ?? 0;

  const cards = [
    {
      label: 'Total Findings',
      value: hasScanned ? totalFindings.toLocaleString() : '—',
      detail: hasScanned
        ? `${charsSanitized.toLocaleString()} sensitive characters found`
        : 'Run a scan to inspect findings',
      icon: ScanSearch,
      iconClass: 'text-[#8B5CF6] dark:text-[#A78BFA] bg-[#8B5CF6]/12',
      valueClass: 'text-slate-900 dark:text-[#F8FAFC]',
    },
    {
      label: 'Categories Detected',
      value: hasScanned ? `${uniqueCategories} / 15` : '0 / 15',
      detail: hasScanned
        ? 'Distinct PII types classified'
        : '15 built-in & custom detectors ready',
      icon: Layers,
      iconClass: 'text-cyan-700 dark:text-[#22D3EE] bg-[#22D3EE]/12',
      valueClass: 'text-slate-900 dark:text-[#F8FAFC]',
    },
    {
      label: 'Redactions Applied',
      value: hasScanned ? totalRedactions.toLocaleString() : '—',
      detail: hasScanned
        ? `Mode: ${redactionMode} · ${durationMs} ms`
        : `Active mode: ${redactionMode}`,
      icon: ShieldCheck,
      iconClass: 'text-emerald-700 dark:text-[#34D399] bg-[#34D399]/12',
      valueClass: 'text-emerald-700 dark:text-[#34D399]',
    },
    {
      label: 'Local Processing',
      value: 'On-Device',
      detail: 'Zero uploads · Browser memory only',
      icon: Lock,
      iconClass: 'text-emerald-700 dark:text-[#34D399] bg-[#34D399]/12',
      valueClass: 'text-emerald-700 dark:text-[#34D399]',
    },
  ];

  return (
    <section
      id="veltrix-stats"
      aria-label="Detection statistics"
      className="grid grid-cols-2 gap-3.5 lg:grid-cols-4"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 dark:border-white/[0.06] dark:bg-[#131318] dark:hover:border-[#8B5CF6]/40"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-slate-500 dark:text-[#94A3B8]">
                {card.label}
              </p>
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${card.iconClass}`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </div>
            <p
              className={`mt-2.5 font-mono text-2xl font-bold tracking-tight tabular-nums ${card.valueClass}`}
            >
              {card.value}
            </p>
            <p className="mt-1 truncate text-[11px] text-slate-500 dark:text-[#94A3B8]">
              {card.detail}
            </p>
          </div>
        );
      })}
    </section>
  );
}
