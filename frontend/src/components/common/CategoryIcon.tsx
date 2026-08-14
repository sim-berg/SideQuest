import { useState } from 'react';
import type { Category } from '../../types/quest';
import { CATEGORY_META } from '../../constants/categories';
import { cn } from '../../utils/cn';

/**
 * Sticker icon of a quest category (generated die-cut sticker art), falling
 * back to the category emoji if the image is missing or fails to load.
 */
export default function CategoryIcon({
  category,
  size = 24,
  className,
}: {
  category: Category;
  /** Rendered square size in px. */
  size?: number;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const meta = CATEGORY_META[category];

  if (broken) {
    return (
      <span className={className} style={{ fontSize: size * 0.8 }}>
        {meta.icon}
      </span>
    );
  }
  return (
    <img
      src={meta.sticker}
      alt={meta.label}
      width={size}
      height={size}
      draggable={false}
      onError={() => setBroken(true)}
      className={cn('inline-block select-none object-contain', className)}
    />
  );
}
