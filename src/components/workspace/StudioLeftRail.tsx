import {
  ChevronLeft,
  ChevronRight,
  Compass,
  FileSpreadsheet,
  FileText,
  FolderUp,
  Lock,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';

interface StudioLeftRailProps {
  expanded: boolean;
  onToggleExpanded: () => void;
  hasUploadedFile: boolean;
  isCSVMode: boolean;
  onBackToOverview: () => void;
  onTriggerUpload: () => void;
  onLoadDemoText: () => void;
  onLoadDemoCSV: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}

export function StudioLeftRail({
  expanded,
  onToggleExpanded,
  hasUploadedFile,
  isCSVMode,
  onBackToOverview,
  onTriggerUpload,
  onLoadDemoText,
  onLoadDemoCSV,
  onOpenSettings,
  onOpenHelp,
}: StudioLeftRailProps) {
  const railItems = [
    {
      label: 'Overview',
      icon: Compass,
      onClick: onBackToOverview,
      active: false,
    },
    {
      label: 'Upload File',
      icon: FolderUp,
      onClick: onTriggerUpload,
      active: hasUploadedFile,
    },
    {
      label: 'Sample TXT',
      icon: FileText,
      onClick: onLoadDemoText,
      active: false,
    },
    {
      label: 'Sample CSV',
      icon: FileSpreadsheet,
      onClick: onLoadDemoCSV,
      active: isCSVMode,
    },
    {
      label: 'Redaction Rules',
      icon: SlidersHorizontal,
      onClick: onOpenSettings,
      active: false,
    },
    {
      label: 'Local Privacy',
      icon: Lock,
      onClick: onOpenHelp,
      active: false,
    },
  ];

  return (
    <aside
      aria-label="Studio navigation rail"
      className={`hidden md:flex shrink-0 flex-col justify-between border-r border-slate-200 bg-slate-50/90 py-3 transition-all duration-200 dark:border-white/[0.06] dark:bg-[#131318] ${
        expanded ? 'w-48 px-2.5' : 'w-14 items-center px-1.5'
      }`}
    >
      <div className={`flex flex-col gap-1.5 ${expanded ? 'w-full' : 'items-center'}`}>
        <button
          type="button"
          onClick={onBackToOverview}
          title="Back to Security Overview"
          className={`mb-2 flex h-9 items-center gap-2.5 rounded-full text-slate-700 transition-colors hover:bg-slate-200/80 dark:text-[#F8FAFC] dark:hover:bg-white/[0.07] ${
            expanded ? 'w-full px-2' : 'w-9 justify-center'
          }`}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[#A78BFA] dark:bg-[#1E1E24] dark:text-[#A78BFA] dark:ring-1 dark:ring-white/10">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </span>
          {expanded && <span className="truncate text-xs font-semibold tracking-tight">Overview</span>}
        </button>

        {railItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              title={item.label}
              aria-label={item.label}
              className={`flex h-9 items-center gap-2.5 rounded-xl text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] ${
                expanded ? 'w-full px-2.5' : 'w-9 justify-center'
              } ${
                item.active
                  ? 'bg-[#8B5CF6]/15 text-[#7C3AED] dark:bg-[#8B5CF6]/20 dark:text-[#F8FAFC]'
                  : 'text-slate-500 hover:bg-slate-200/70 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:bg-white/[0.06] dark:hover:text-[#F8FAFC]'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {expanded && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onToggleExpanded}
        title={expanded ? 'Collapse rail' : 'Expand rail'}
        aria-label={expanded ? 'Collapse left rail' : 'Expand left rail'}
        className={`flex h-8 items-center gap-2 rounded-lg text-xs text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-slate-800 dark:text-[#7A7E91] dark:hover:bg-white/[0.06] dark:hover:text-[#F8FAFC] ${
          expanded ? 'w-full px-2.5' : 'w-8 justify-center'
        }`}
      >
        {expanded ? (
          <>
            <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Collapse</span>
          </>
        ) : (
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </aside>
  );
}
