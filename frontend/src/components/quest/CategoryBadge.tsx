import type { Category } from '../../types/quest';
import { CATEGORY_META } from '../../constants/categories';

interface CategoryBadgeProps {
  category: Category;
}

export default function CategoryBadge({ category }: CategoryBadgeProps) {
  const meta = CATEGORY_META[category];

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
      style={{ backgroundColor: meta.color }}
    >
      <span>{meta.icon}</span>
      {meta.label}
    </span>
  );
}
