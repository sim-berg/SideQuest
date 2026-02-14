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
        'shrink-0 rounded-lg border-2 px-3 py-1.5 text-xs font-medium transition-all',
        active
          ? 'border-gold bg-wood text-parchment-light shadow-sm'
          : 'border-wood-light/40 bg-parchment text-medieval-text dark:border-wood/40 dark:bg-medieval-surface dark:text-medieval-text-light',
      )}
    >
      {label}
    </button>
  );
}
