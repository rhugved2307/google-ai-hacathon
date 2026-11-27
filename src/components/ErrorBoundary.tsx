import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  sectionName: string;
  children: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Privacy-safe React Error Boundary.
 * Catches unexpected UI/render errors without logging or displaying any user input or PII.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public override componentDidCatch(_error: Error, _errorInfo: ErrorInfo): void {
    // Intentionally silent: VELTRIX never logs runtime details that might include sensitive user data.
  }

  private readonly handleRecover = (): void => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  public override render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        role="alert"
        className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border border-amber-500/35 bg-amber-50/80 p-6 text-center dark:border-[#F59E0B]/30 dark:bg-[#171232]/90"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-[#FBBF24]">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">
            Unable to render {this.props.sectionName}
          </h2>
          <p className="max-w-md text-xs text-slate-600 dark:text-[#94A3B8]">
            An unexpected rendering issue occurred locally. Your data stayed strictly in browser
            memory and was never transmitted.
          </p>
        </div>
        <button
          type="button"
          onClick={this.handleRecover}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#8B5CF6] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#7C3AED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Recover {this.props.sectionName}</span>
        </button>
      </div>
    );
  }
}
