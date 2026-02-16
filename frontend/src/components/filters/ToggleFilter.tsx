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
        'shrink-0 rounded-md border px-3 py-1.5 text-xs font-medium transition-all',
        active
          ? 'border-neon-magenta bg-neon-magenta/15 text-neon-magenta'
          : 'border-cyber-light-border bg-cyber-light-card text-cyber-light-text-dim dark:border-cyber-border dark:bg-cyber-card dark:text-cyber-text-dim',
      )}
      style={active ? { boxShadow: '0 0 10px #ff00aa30' } : undefined}
    >
      {label}
    </button>
  );
}
