import type { Category } from '../../types/quest';
import { CATEGORY_META } from '../../constants/categories';

interface CategoryBadgeProps {
  category: Category;
}

export default function CategoryBadge({ category }: CategoryBadgeProps) {
  const meta = CATEGORY_META[category];

  return (
    <span
      className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-semibold"
      style={{
        color: meta.color,
        borderColor: `${meta.color}60`,
        backgroundColor: `${meta.color}15`,
      }}
    >
      {meta.label}
    </span>
  );
}
