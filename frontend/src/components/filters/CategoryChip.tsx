import type { Category } from '../../types/quest';
import { CATEGORY_META } from '../../constants/categories';
import { useFilterStore } from '../../stores/useFilterStore';
import { cn } from '../../utils/cn';

interface CategoryChipProps {
  category: Category;
}

export default function CategoryChip({ category }: CategoryChipProps) {
  const categories = useFilterStore((s) => s.categories);
  const toggleCategory = useFilterStore((s) => s.toggleCategory);
  const meta = CATEGORY_META[category];
  const active = categories.includes(category);

  return (
    <button
      onClick={() => toggleCategory(category)}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all',
        active
          ? 'border-transparent text-white shadow-md'
          : 'border-slate-300 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300',
      )}
      style={active ? { backgroundColor: meta.color } : undefined}
    >
      <span>{meta.icon}</span>
      <span>{meta.label}</span>
    </button>
  );
}
