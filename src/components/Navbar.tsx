import {
  ChevronDown,
  FolderOpen,
  HelpCircle,
  LayoutGrid,
  Menu,
  Moon,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { AppPage, RedactionMode } from '../engine/types';
import type { ThemeMode } from '../hooks/useTheme';

export type { AppPage };

interface NavbarProps {
  activePage: AppPage;
  onChangePage: (page: AppPage) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onQuickUploadClick: () => void;
  onResetSession: () => void;
  redactionMode: RedactionMode;
  searchQuery: string;
  onChangeSearch: (q: string) => void;
}

export function Navbar({
  activePage,
  onChangePage,
  theme,
  onToggleTheme,
  onOpenSettings,
  onOpenHelp,
  onQuickUploadClick,
  onResetSession,
  redactionMode,
  searchQuery,
  onChangeSearch,
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-white/[0.06] dark:bg-[#0D0D12]/90">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Left: Circular VELTRIX Emblem + 3 Reference Navigation Icons */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <button
            type="button"
            onClick={() => onChangePage('overview')}
            title="VELTRIX Overview"
            aria-label="VELTRIX Overview"
            className="flex items-center gap-2.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm dark:bg-[#191921] dark:text-[#F8FAFC] dark:ring-1 dark:ring-white/10">
              <ShieldCheck className="h-4.5 w-4.5 text-[#A78BFA]" aria-hidden="true" />
            </span>
            <span className="hidden text-sm font-bold tracking-tight text-slate-900 sm:inline dark:text-[#F8FAFC]">
              VELTRIX
            </span>
          </button>

          {/* Reference 3-icon toolbar: Overview | Workspace Grid | Upload Folder */}
          <nav aria-label="Primary views" className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onChangePage('overview')}
              title="Security Overview"
              aria-label="Security Overview"
              aria-current={activePage === 'overview' ? 'page' : undefined}
              className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] ${
                activePage === 'overview'
                  ? 'bg-[#8B5CF6]/15 text-[#7C3AED] dark:bg-[#8B5CF6]/20 dark:text-[#F8FAFC]'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:bg-white/[0.06] dark:hover:text-[#F8FAFC]'
              }`}
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
              <span className="hidden xl:inline">Overview</span>
            </button>

            <button
              type="button"
              onClick={() => onChangePage('workspace')}
              title="Sanitizer Workspace"
              aria-label="Sanitizer Workspace"
              aria-current={activePage === 'workspace' ? 'page' : undefined}
              className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] ${
                activePage === 'workspace'
                  ? 'bg-[#8B5CF6]/15 text-[#7C3AED] dark:bg-[#8B5CF6]/20 dark:text-[#F8FAFC]'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:bg-white/[0.06] dark:hover:text-[#F8FAFC]'
              }`}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden="true" />
              <span className="hidden xl:inline">Sanitizer</span>
            </button>

            <button
              type="button"
              onClick={onQuickUploadClick}
              title="Open File / CSV Sanitizer"
              aria-label="Open File or CSV Sanitizer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] dark:text-[#94A3B8] dark:hover:bg-white/[0.06] dark:hover:text-[#F8FAFC]"
            >
              <FolderOpen className="h-4 w-4" aria-hidden="true" />
            </button>
          </nav>
        </div>

        {/* Center: Reference Pill Search Bar ("What are you looking for?") */}
        <div className="hidden flex-1 max-w-xl md:block">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-[#7A7E91]"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onChangeSearch(e.target.value)}
              aria-label="Search datasets, categories, or detections"
              placeholder="What are you looking for?"
              className="h-10 w-full rounded-full border border-slate-200 bg-slate-100/90 pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#8B5CF6]/60 focus:bg-white focus:outline-none dark:border-white/[0.06] dark:bg-[#1E1E26] dark:text-[#F8FAFC] dark:placeholder:text-[#7A7E91] dark:focus:border-[#8B5CF6]/60 dark:focus:bg-[#23232D]"
            />
          </div>
        </div>

        {/* Right: Quick Controls + Reference Violet Avatar Pill */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenSettings}
            title={`Redaction Settings (${redactionMode})`}
            aria-label="Open redaction settings"
            className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:border-[#8B5CF6]/50 dark:border-white/[0.08] dark:bg-[#191921] dark:text-[#E2E8F0] dark:hover:border-[#8B5CF6]/50"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#8B5CF6] dark:text-[#A78BFA]" aria-hidden="true" />
            <span className="capitalize">{redactionMode}</span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-[#8B5CF6]/50 dark:border-white/[0.08] dark:bg-[#191921] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          {/* Reference Profile / Local Device Pill with dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="inline-flex h-10 items-center gap-2.5 rounded-full border border-slate-200 bg-slate-100/90 pl-1.5 pr-2.5 text-xs font-medium text-slate-900 transition-colors hover:border-[#8B5CF6]/40 dark:border-white/[0.07] dark:bg-[#1C1C24] dark:text-[#F8FAFC] dark:hover:border-[#8B5CF6]/45"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] text-[11px] font-bold text-white shadow-xs">
                VX
              </span>
              <span className="hidden sm:inline whitespace-nowrap">Local Session</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200/80 text-slate-600 dark:bg-white/[0.08] dark:text-[#94A3B8]">
                <ChevronDown className="h-3 w-3" aria-hidden="true" />
              </span>
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-white/10 dark:bg-[#16161F]"
              >
                <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-[11px] font-medium text-emerald-700 dark:text-[#34D399]">
                  <span className="h-2 w-2 rounded-full bg-[#34D399]" />
                  <span>100% On-Device Processing</span>
                </div>

                <div className="mt-1.5 space-y-0.5 text-xs">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onChangePage('overview');
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-slate-700 hover:bg-slate-100 dark:text-[#E2E8F0] dark:hover:bg-white/[0.06]"
                  >
                    <Menu className="h-3.5 w-3.5 text-[#A78BFA]" />
                    <span>Security Overview</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onChangePage('workspace');
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-slate-700 hover:bg-slate-100 dark:text-[#E2E8F0] dark:hover:bg-white/[0.06]"
                  >
                    <LayoutGrid className="h-3.5 w-3.5 text-[#22D3EE]" />
                    <span>Open Sanitizer Workspace</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenSettings();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-slate-700 hover:bg-slate-100 dark:text-[#E2E8F0] dark:hover:bg-white/[0.06]"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5 text-[#8B5CF6]" />
                    <span>Redaction Settings</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenHelp();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-slate-700 hover:bg-slate-100 dark:text-[#E2E8F0] dark:hover:bg-white/[0.06]"
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-[#34D399]" />
                    <span>Privacy Verification &amp; Help</span>
                  </button>

                  <div className="my-1 border-t border-slate-200 dark:border-white/[0.07]" />

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onResetSession();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-amber-700 hover:bg-amber-500/10 dark:text-[#FBBF24] dark:hover:bg-amber-500/15"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset Session / Demo Data</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
