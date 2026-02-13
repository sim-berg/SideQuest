import { Category } from '../../types/quest';
import { useFilterStore } from '../../stores/useFilterStore';
import CategoryChip from './CategoryChip';
import DistanceSelect from './DistanceSelect';
import ToggleFilter from './ToggleFilter';

const ALL_CATEGORIES = Object.values(Category);

export default function FilterBar() {
  const paidOnly = useFilterStore((s) => s.paidOnly);
  const timedOnly = useFilterStore((s) => s.timedOnly);
  const togglePaidOnly = useFilterStore((s) => s.togglePaidOnly);
  const toggleTimedOnly = useFilterStore((s) => s.toggleTimedOnly);

  return (
    <div className="absolute top-0 right-0 left-0 z-10 bg-white/80 px-3 pt-[env(safe-area-inset-top)] backdrop-blur-md dark:bg-slate-900/80">
      <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-hide">
        {ALL_CATEGORIES.map((cat) => (
          <CategoryChip key={cat} category={cat} />
        ))}
        <div className="mx-1 h-6 w-px shrink-0 bg-slate-300 dark:bg-slate-600" />
        <DistanceSelect />
        <ToggleFilter label="Bezahlt" active={paidOnly} onToggle={togglePaidOnly} />
        <ToggleFilter label="Zeitlimit" active={timedOnly} onToggle={toggleTimedOnly} />
      </div>
    </div>
  );
}
