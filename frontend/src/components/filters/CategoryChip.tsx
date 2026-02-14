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
        'flex shrink-0 items-center gap-1.5 rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition-all',
        active
          ? 'border-gold text-white shadow-md'
          : 'border-wood-light/40 bg-parchment text-medieval-text dark:border-wood/40 dark:bg-medieval-surface dark:text-medieval-text-light',
      )}
      style={active ? { backgroundColor: meta.color, borderColor: '#C9A84C' } : undefined}
    >
      <span>{meta.label}</span>
    </button>
  );
}
