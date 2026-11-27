import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

interface ToastStackProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-18 right-4 z-50 flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0 lg:bottom-4 pointer-events-none"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const icon =
          toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-[#34D399]" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-[#F87171]" />
          ) : (
            <Info className="h-4 w-4 shrink-0 text-[#8B5CF6] dark:text-[#A78BFA]" />
          );

        const borderClass =
          toast.type === 'success'
            ? 'border-emerald-500/35'
            : toast.type === 'error'
              ? 'border-red-500/40'
              : 'border-[#8B5CF6]/35';

        return (
          <div
            key={toast.id}
            role={toast.type === 'error' ? 'alert' : 'status'}
            aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border ${borderClass} bg-white p-3.5 shadow-xl shadow-slate-900/15 dark:bg-[#191335] dark:shadow-black/50`}
          >
            <span className="mt-0.5">{icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 dark:text-[#F8FAFC]">
                {toast.title}
              </p>
              {toast.description && (
                <p className="mt-0.5 text-[11px] text-slate-600 dark:text-[#94A3B8]">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.08] dark:hover:text-[#F8FAFC]"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
