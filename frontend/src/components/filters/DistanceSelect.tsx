import { DISTANCE_OPTIONS } from '../../constants/map';
import { useFilterStore } from '../../stores/useFilterStore';
import { cn } from '../../utils/cn';

export default function DistanceSelect() {
  const distanceKm = useFilterStore((s) => s.distanceKm);
  const setDistance = useFilterStore((s) => s.setDistance);

  return (
    <div className="flex shrink-0 items-center gap-1 rounded-lg border-2 border-wood-light/40 bg-parchment p-0.5 dark:border-wood/40 dark:bg-medieval-surface">
      {DISTANCE_OPTIONS.map((km) => (
        <button
          key={km}
          onClick={() => setDistance(km)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-medium transition-all',
            distanceKm === km
              ? 'bg-gold text-medieval-text shadow-sm'
              : 'text-medieval-text hover:bg-parchment-dark/50 dark:text-medieval-text-light dark:hover:bg-wood-dark/50',
          )}
        >
          {km}km
        </button>
      ))}
    </div>
  );
}
