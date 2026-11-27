import { ArrowUpRight } from 'lucide-react';

interface ProtectedMetricCardProps {
  heading: string;
  metricValue: number;
  hasScanned: boolean;
  onOpenWorkspace: () => void;
}

export function ProtectedMetricCard({
  heading,
  metricValue,
  hasScanned,
  onOpenWorkspace,
}: ProtectedMetricCardProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">{heading}</h2>
        <button
          type="button"
          onClick={onOpenWorkspace}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#8B5CF6]/45 bg-[#8B5CF6]/10 px-3.5 py-1 text-xs font-semibold text-[#7C3AED] transition-all hover:border-[#8B5CF6] hover:bg-[#8B5CF6]/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] whitespace-nowrap dark:border-[#A78BFA]/40 dark:bg-[#8B5CF6]/15 dark:text-[#EDE9FE] dark:hover:border-[#A78BFA]/80 dark:hover:bg-[#8B5CF6]/25"
        >
          <span>Open Sanitizer</span>
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      <button
        type="button"
        onClick={onOpenWorkspace}
        className="veltrix-orb-stage group relative flex h-[196px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 text-center shadow-lg transition-transform duration-200 hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A78BFA]"
      >
        <span
          aria-hidden="true"
          className="veltrix-orb-sphere pointer-events-none absolute -left-8 -top-10 h-28 w-28 opacity-90 transition-transform duration-500 group-hover:translate-x-1"
        />
        <span
          aria-hidden="true"
          className="veltrix-orb-sphere pointer-events-none absolute left-[42%] -top-6 h-12 w-12 opacity-75 blur-[0.5px]"
        />
        <span
          aria-hidden="true"
          className="veltrix-orb-sphere pointer-events-none absolute -right-4 top-6 h-14 w-14 opacity-85"
        />
        <span
          aria-hidden="true"
          className="veltrix-orb-sphere pointer-events-none absolute left-10 bottom-7 h-7 w-7 opacity-80"
        />
        <span
          aria-hidden="true"
          className="veltrix-orb-sphere pointer-events-none absolute -bottom-12 right-2 h-32 w-32 opacity-95 transition-transform duration-500 group-hover:-translate-y-1"
        />
        <span
          aria-hidden="true"
          className="veltrix-orb-sphere pointer-events-none absolute -bottom-5 right-24 h-14 w-14 opacity-90"
        />

        <div className="relative z-10 space-y-1">
          <p className="font-mono text-3xl font-bold tracking-tight tabular-nums text-white drop-shadow-sm sm:text-4xl">
            {metricValue.toLocaleString()}
          </p>
          <p className="text-[11px] font-medium text-violet-200/80">
            {hasScanned
              ? 'Sanitized on this device · Click to inspect'
              : 'Ready locally · Click to launch Sanitizer'}
          </p>
        </div>
      </button>
    </div>
  );
}
