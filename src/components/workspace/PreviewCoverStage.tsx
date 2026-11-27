import type { RedactionMode } from '../../engine/types';

const HEX_MATRIX_ROWS: readonly string[] = [
  '56D45C3B C34B 089018F0 8F078F6 9A1891290',
  '089018F0 8F078F6 7F 4CD4C 56D45C3B 23A12',
  '4B 67E56 6 5 D5 DE5DE5CD 4CD4C 8F078F018',
  '23A129 29A1 9A129A29 4BC45 67E67E 9018F0',
  '78F67E 6 E 56D45C3B 8F078F 34B29A1 4CD4C',
  'C34B 9A129A29 4CD4C 8F078F0 67E67E 29A19',
  'DE5DE5CD 34B 3 23A129 4BC45 9018F0 8F078',
  '78F67E078 EF6D C34B3 67E67E 089018 4CD4C',
];

interface PreviewCoverStageProps {
  enabledDetectorCount: number;
  redactionMode: RedactionMode;
  hasInputText: boolean;
  onLoadDemoText: () => void;
  onLoadDemoCSV: () => void;
  onScan: () => void;
}

export function PreviewCoverStage({
  enabledDetectorCount,
  redactionMode,
  hasInputText,
  onLoadDemoText,
  onLoadDemoCSV,
  onScan,
}: PreviewCoverStageProps) {
  return (
    <div className="veltrix-orb-stage relative flex h-full min-h-[380px] flex-col justify-between overflow-hidden p-5 text-white">
      {/* Signature 3D Floating Violet Bubbles matching Page 1 */}
      <span
        aria-hidden="true"
        className="veltrix-orb-sphere pointer-events-none absolute -left-8 -top-10 h-28 w-28 opacity-85"
      />
      <span
        aria-hidden="true"
        className="veltrix-orb-sphere pointer-events-none absolute left-[46%] -top-6 h-12 w-12 opacity-70 blur-[0.5px]"
      />
      <span
        aria-hidden="true"
        className="veltrix-orb-sphere pointer-events-none absolute -right-5 top-10 h-16 w-16 opacity-80"
      />
      <span
        aria-hidden="true"
        className="veltrix-orb-sphere pointer-events-none absolute left-8 bottom-12 h-8 w-8 opacity-75"
      />
      <span
        aria-hidden="true"
        className="veltrix-orb-sphere pointer-events-none absolute -bottom-12 right-2 h-32 w-32 opacity-90"
      />
      <span
        aria-hidden="true"
        className="veltrix-orb-sphere pointer-events-none absolute -bottom-5 right-24 h-14 w-14 opacity-80"
      />

      {/* Subtle Hex Cipher Matrix Overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 select-none overflow-hidden p-3 font-mono text-[13px] leading-7 tracking-[0.14em] text-[#DDD6FE]/[0.11]"
      >
        {HEX_MATRIX_ROWS.map((row, idx) => (
          <p key={idx} className="whitespace-nowrap">
            {row}
          </p>
        ))}
      </div>

      {/* Top Editorial Header */}
      <div className="relative z-10 flex items-center justify-between gap-2 border-b border-violet-200/15 pb-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-violet-200/75">
          LOCAL SANITIZER
        </span>
        <div className="flex items-center gap-2 text-right">
          <span className="text-sm font-semibold tracking-wider text-white">VELTRIX</span>
          <span className="h-4 w-px bg-violet-200/30" aria-hidden="true" />
          <span className="text-[9px] leading-tight uppercase tracking-wider text-violet-100/70">
            On-Device
            <br />
            Privacy Engine
          </span>
        </div>
      </div>

      {/* Center Visual: Architectural Violet-Metallic Padlock + Editorial Cover Title */}
      <div className="relative z-10 my-5 grid grid-cols-12 items-center gap-4">
        <div className="col-span-5 flex items-center justify-center">
          <svg
            viewBox="0 0 110 138"
            className="h-32 w-26 drop-shadow-[0_14px_24px_rgba(9,6,24,0.75)]"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="padlockShackle" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EDE9FE" />
                <stop offset="50%" stopColor="#A78BFA" />
                <stop offset="100%" stopColor="#4C1D95" />
              </linearGradient>
              <linearGradient id="padlockBody" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#DDD6FE" />
                <stop offset="45%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#3B1D7A" />
              </linearGradient>
            </defs>
            <path
              d="M 30 58 V 36 C 30 18 80 18 80 36 V 58"
              fill="none"
              stroke="url(#padlockShackle)"
              strokeWidth="11"
              strokeLinecap="round"
            />
            <rect x="16" y="54" width="78" height="72" rx="10" fill="url(#padlockBody)" />
            <circle cx="55" cy="83" r="9" fill="#130B2E" />
            <path d="M 51 86 L 59 86 L 61 106 L 49 106 Z" fill="#130B2E" />
          </svg>
        </div>

        <div className="col-span-7 space-y-2">
          <h2 className="text-lg font-bold leading-snug tracking-tight text-white">
            The Effect of Sanitization on Sensitive Communications and Data
          </h2>
          <div className="space-y-0.5 text-[11px] text-violet-100/75">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#C4B5FD]">
              Active Engine Profile
            </p>
            <p>{enabledDetectorCount} Built-in PII Detectors</p>
            <p className="capitalize">Redaction Mode: {redactionMode}</p>
            <p>Zero Cloud &amp; Zero Telemetry</p>
          </div>
        </div>
      </div>

      {/* Bottom Action Strip inside Cover */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-t border-violet-200/15 pt-3.5">
        <span className="text-[10px] uppercase tracking-wider text-violet-100/65">
          Ready for local scan
        </span>

        <div className="flex items-center gap-2">
          {!hasInputText && (
            <button
              type="button"
              onClick={onLoadDemoText}
              className="rounded-lg border border-violet-200/25 bg-white/10 px-2.5 py-1.5 text-[11px] font-medium text-white backdrop-blur-xs transition-colors hover:bg-white/20"
            >
              Load Sample
            </button>
          )}
          <button
            type="button"
            onClick={hasInputText ? onScan : onLoadDemoCSV}
            className="rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm shadow-[#8B5CF6]/35 transition-all hover:brightness-110"
          >
            {hasInputText ? 'Scan Document' : 'Try CSV Sample'}
          </button>
        </div>
      </div>
    </div>
  );
}
