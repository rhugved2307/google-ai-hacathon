import { ArrowUpRight } from 'lucide-react';
import { getRiskBadge } from '../../utils/formatting';

interface RiskScoreGaugeCardProps {
  riskScorePct: number;
  hasScanned: boolean;
  lastUpdatedText: string;
  onOpenWorkspace: () => void;
}

const GAUGE_RADIUS = 64;
const GAUGE_CIRCUMFERENCE = Math.PI * GAUGE_RADIUS;

export function RiskScoreGaugeCard({
  riskScorePct,
  hasScanned,
  lastUpdatedText,
  onOpenWorkspace,
}: RiskScoreGaugeCardProps) {
  const clampedScore = Math.max(0, Math.min(100, riskScorePct));
  const riskBadge = getRiskBadge(clampedScore, hasScanned);
  const gaugeOffset = GAUGE_CIRCUMFERENCE * (1 - clampedScore / 100);
  const needleAngleRad = Math.PI * (1 - clampedScore / 100);
  const needleX1 = 90 + Math.cos(needleAngleRad) * (GAUGE_RADIUS - 12);
  const needleY1 = 84 - Math.sin(needleAngleRad) * (GAUGE_RADIUS - 12);
  const needleX2 = 90 + Math.cos(needleAngleRad) * (GAUGE_RADIUS + 6);
  const needleY2 = 84 - Math.sin(needleAngleRad) * (GAUGE_RADIUS + 6);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onOpenWorkspace}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#8B5CF6]/45 bg-[#8B5CF6]/10 px-3.5 py-1 text-xs font-semibold text-[#7C3AED] transition-all hover:border-[#8B5CF6] hover:bg-[#8B5CF6]/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] whitespace-nowrap dark:border-[#A78BFA]/40 dark:bg-[#8B5CF6]/15 dark:text-[#EDE9FE] dark:hover:border-[#A78BFA]/80 dark:hover:bg-[#8B5CF6]/25"
        >
          <span>PII Risk Score</span>
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <span className="font-mono text-[11px] text-emerald-700 dark:text-[#34D399]">
          100% Local
        </span>
      </div>

      <div className="flex h-[196px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/[0.06] dark:bg-[#191335]/85">
        <div className="relative flex flex-col items-center">
          <svg
            viewBox="0 0 180 100"
            className="h-[104px] w-[180px] overflow-visible"
            aria-label={`PII Risk Score ${clampedScore} percent`}
          >
            <defs>
              <linearGradient id="veltrixGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#A78BFA" />
              </linearGradient>
            </defs>
            <path
              d="M 26 84 A 64 64 0 0 1 154 84"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              strokeLinecap="butt"
              className="text-slate-200 dark:text-[#2D264B]"
            />
            <path
              d="M 26 84 A 64 64 0 0 1 154 84"
              fill="none"
              stroke="url(#veltrixGaugeGrad)"
              strokeWidth="12"
              strokeDasharray={GAUGE_CIRCUMFERENCE}
              strokeDashoffset={gaugeOffset}
              className="transition-all duration-500"
            />
            <line
              x1={needleX1}
              y1={needleY1}
              x2={needleX2}
              y2={needleY2}
              stroke="#F8FAFC"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>

          <span className="-mt-9 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-[#F8FAFC]">
            {clampedScore}%
          </span>
        </div>

        <span
          className={`mt-2.5 inline-flex items-center rounded-full px-4 py-1 text-xs font-semibold text-white shadow-sm ${riskBadge.bg}`}
        >
          {riskBadge.label}
        </span>

        <p className="mt-2.5 text-[11px] text-slate-500 dark:text-[#7E789E]">
          Last Updated: Today {lastUpdatedText} · On-Device
        </p>
      </div>
    </div>
  );
}
