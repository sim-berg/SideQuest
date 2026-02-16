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
        'flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-all',
        active
          ? 'border-current text-white'
          : 'border-cyber-light-border bg-cyber-light-card text-cyber-light-text dark:border-cyber-border dark:bg-cyber-card dark:text-cyber-text',
      )}
      style={active ? { backgroundColor: `${meta.color}20`, color: meta.color, borderColor: meta.color, boxShadow: `0 0 10px ${meta.color}40` } : undefined}
    >
      <span>{meta.label}</span>
    </button>
  );
}
