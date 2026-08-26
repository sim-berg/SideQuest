import type { Emblem } from '../../types/achievement';
import { cn } from '../../utils/cn';

const SIZES = {
  sm: 'h-10 w-10 text-lg',
  md: 'h-14 w-14 text-2xl',
  lg: 'h-24 w-24 text-4xl',
} as const;

/**
 * One emblem as a round badge. Renders the generated PNG when there is one and
 * falls back to the emoji on its color, so a badge whose art is still
 * generating never shows as a broken image.
 */
export default function EmblemBadge({
  emblem,
  size = 'sm',
  onClick,
  className,
}: {
  emblem: Emblem;
  size?: keyof typeof SIZES;
  onClick?: () => void;
  className?: string;
}) {
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      onClick={onClick}
      title={emblem.title}
      aria-label={emblem.title}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full ring-2 ring-white/70 dark:ring-slate-800',
        SIZES[size],
        onClick && 'transition-transform hover:scale-110 active:scale-95',
        className,
      )}
      style={{
        backgroundColor: emblem.imageUrl ? 'transparent' : `${emblem.color}22`,
        boxShadow: `0 2px 10px ${emblem.color}44`,
      }}
    >
      {emblem.imageUrl ? (
        <img
          src={emblem.imageUrl}
          alt={emblem.title}
          className="h-full w-full rounded-full object-contain"
        />
      ) : (
        <span>{emblem.emoji}</span>
      )}
    </Tag>
  );
}
