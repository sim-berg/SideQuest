import type { LucideIcon } from 'lucide-react';

export type RoundButtonVariant = 'default' | 'primary' | 'success' | 'danger';

const VARIANTS: Record<RoundButtonVariant, string> = {
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  primary: 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30',
  success: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30',
  danger: 'bg-red-50 text-red-500 dark:bg-red-950/40',
};

export default function RoundActionButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  variant = 'default',
  size = 'md',
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: RoundButtonVariant;
  size?: 'sm' | 'md';
}) {
  const dim = size === 'sm' ? 'h-11 w-11' : 'h-14 w-14';
  const iconDim = size === 'sm' ? 'h-5 w-5' : 'h-6 w-6';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex shrink-0 flex-col items-center gap-1.5 disabled:opacity-50"
    >
      <span
        className={`flex items-center justify-center rounded-full transition-all active:scale-90 ${dim} ${VARIANTS[variant]}`}
      >
        <Icon className={iconDim} strokeWidth={2.2} />
      </span>
      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
        {label}
      </span>
    </button>
  );
}
