"use client";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-3 py-12 px-6">
      <div className="w-14 h-14 rounded flex items-center justify-center border border-edu-slate-200 text-edu-slate-400 mb-1">
        {icon}
      </div>
      <p className="font-display font-semibold text-[15px] text-edu-ink">{title}</p>
      <p className="text-[13px] leading-relaxed text-edu-slate-500 max-w-[280px]">{description}</p>
      {action && (
        <button onClick={action.onClick} className="btn-ghost mt-2 py-2 px-5 text-[13px]">
          {action.label}
        </button>
      )}
    </div>
  );
}
