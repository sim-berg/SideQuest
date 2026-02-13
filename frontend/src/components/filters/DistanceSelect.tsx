import { DISTANCE_OPTIONS } from '../../constants/map';
import { useFilterStore } from '../../stores/useFilterStore';
import { cn } from '../../utils/cn';

export default function DistanceSelect() {
  const distanceKm = useFilterStore((s) => s.distanceKm);
  const setDistance = useFilterStore((s) => s.setDistance);

  return (
    <div className="flex shrink-0 items-center gap-1 rounded-full border border-slate-300 bg-white p-0.5 dark:border-slate-600 dark:bg-slate-800">
      {DISTANCE_OPTIONS.map((km) => (
        <button
          key={km}
          onClick={() => setDistance(km)}
          className={cn(
            'rounded-full px-2.5 py-1 text-xs font-medium transition-all',
            distanceKm === km
              ? 'bg-indigo-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700',
          )}
        >
          {km}km
        </button>
      ))}
    </div>
  );
}
