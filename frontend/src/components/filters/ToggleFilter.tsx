import { cn } from '../../utils/cn';

interface ToggleFilterProps {
  label: string;
  active: boolean;
  onToggle: () => void;
}

export default function ToggleFilter({
  label,
  active,
  onToggle,
}: ToggleFilterProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
        active
          ? 'border-indigo-500 bg-indigo-500 text-white shadow-sm'
          : 'border-slate-300 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300',
      )}
    >
      {label}
    </button>
  );
}
