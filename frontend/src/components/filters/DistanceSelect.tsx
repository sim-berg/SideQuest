import { DISTANCE_OPTIONS } from '../../constants/map';
import { useFilterStore } from '../../stores/useFilterStore';
import { cn } from '../../utils/cn';

export default function DistanceSelect() {
  const distanceKm = useFilterStore((s) => s.distanceKm);
  const setDistance = useFilterStore((s) => s.setDistance);

  return (
    <div className="flex shrink-0 items-center gap-1 rounded-md border border-cyber-light-border bg-cyber-light-card p-0.5 dark:border-cyber-border dark:bg-cyber-card">
      {DISTANCE_OPTIONS.map((km) => (
        <button
          key={km}
          onClick={() => setDistance(km)}
          className={cn(
            'rounded px-2.5 py-1 text-xs font-medium transition-all',
            distanceKm === km
              ? 'bg-neon-cyan/20 text-neon-cyan shadow-sm'
              : 'text-cyber-light-text-dim hover:bg-neon-cyan/5 dark:text-cyber-text-dim dark:hover:bg-neon-cyan/5',
          )}
          style={distanceKm === km ? { boxShadow: '0 0 8px #00f0ff30' } : undefined}
        >
          {km}km
        </button>
      ))}
    </div>
  );
}
