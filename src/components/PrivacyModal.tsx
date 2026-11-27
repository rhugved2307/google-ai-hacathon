import { AlertTriangle, CheckCircle2, Keyboard, ShieldCheck, X } from 'lucide-react';
import { useRef } from 'react';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';
import { getBrowserStorageCounts } from '../utils/storageAudit';

interface PrivacyModalProps {
  open: boolean;
  onClose: () => void;
}

export function PrivacyModal({ open, onClose }: PrivacyModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useDialogAccessibility(open, dialogRef, onClose);

  if (!open) return null;

  const { totalKeys } = getBrowserStorageCounts();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/[0.08] dark:bg-[#131318]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8B5CF6]/15 text-[#7C3AED] dark:text-[#A78BFA]">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2
                id="privacy-modal-title"
                className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC]"
              >
                VELTRIX Privacy Verification &amp; Guide
              </h2>
              <p className="text-xs font-semibold text-[#7C3AED] dark:text-[#A78BFA]">
                YOUR DATA STAYS ON THIS DEVICE — PROCESSING HAPPENS LOCALLY.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.08] dark:hover:text-[#F8FAFC]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 space-y-5 text-sm leading-relaxed text-slate-600 dark:text-[#94A3B8]">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">
              Zero-Upload Client-Side Architecture
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed">
              Your files and text are processed entirely on this device. VELTRIX never uploads,
              transmits, logs, or stores your sensitive content on any external server or cloud
              service. You can independently verify this by opening your browser DevTools Network
              tab or disconnecting from the internet after loading the page.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[
              'Processing method: Browser-only',
              'External data transmission: None',
              'API calls with user content: None',
              `Persistent storage keys: ${totalKeys}`,
              'File upload to backend: None',
              'Console logging of raw PII: Disabled',
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 dark:border-white/[0.08] dark:bg-[#191335]/80 dark:text-[#F8FAFC]"
              >
                <CheckCircle2
                  className="h-4 w-4 shrink-0 text-emerald-600 dark:text-[#34D399]"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-amber-50/70 p-4 dark:border-[#F59E0B]/30 dark:bg-[#F59E0B]/10">
            <div className="flex items-start gap-2.5">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-[#F59E0B]"
                aria-hidden="true"
              />
              <div className="space-y-1 text-xs">
                <p className="font-semibold text-amber-950 dark:text-[#F8FAFC]">
                  Detection Limitations
                </p>
                <p className="text-amber-900/90 dark:text-[#94A3B8]">
                  VELTRIX combines deterministic patterns, checksums (Luhn, Verhoeff, IPv4), and
                  lightweight offline heuristics. Pattern detection is <strong>not</strong> official
                  identity verification and may miss ambiguous or non-standard sensitive data.
                  Always review sanitized output before sharing.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">
              <Keyboard className="h-4 w-4 text-[#8B5CF6] dark:text-[#A78BFA]" aria-hidden="true" />
              <span>Keyboard Shortcuts</span>
            </h3>
            <div className="mt-2 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 dark:border-white/[0.08]">
                <span>Scan &amp; Sanitize</span>
                <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700 dark:bg-[#191335] dark:text-[#F8FAFC]">
                  Ctrl / ⌘ + Enter
                </kbd>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 dark:border-white/[0.08]">
                <span>Close Drawer / Dialog</span>
                <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700 dark:bg-[#191335] dark:text-[#F8FAFC]">
                  Esc
                </kbd>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-slate-200 pt-4 dark:border-white/[0.08]">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center rounded-xl bg-[#8B5CF6] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#7C3AED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
