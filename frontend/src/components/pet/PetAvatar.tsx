import type { Pet } from '../../types/pet';
import { ELEMENT_META, SPECIES_EMOJI } from '../../constants/pets';
import AnimatedDragon from '../dragon/AnimatedDragon';
import { cn } from '../../utils/cn';

/**
 * Compact visual for a pet: species emoji inside an element-colored aura.
 * Unhatched eggs render as the mystery egg; the legendary Drache keeps the
 * hand-drawn animated SVG from the old dragon system.
 */
export default function PetAvatar({
  pet,
  size = 64,
  className,
}: {
  pet: Pet;
  size?: number;
  className?: string;
}) {
  const isEgg = !pet.species;
  const element = pet.element ? ELEMENT_META[pet.element] : null;
  const color = element?.color ?? '#94a3b8';

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center rounded-full',
        className,
      )}
      style={{
        width: size,
        height: size,
        background: isEgg
          ? 'radial-gradient(circle at 35% 30%, #e2e8f088, #94a3b833)'
          : `radial-gradient(circle at 35% 30%, ${color}55, ${color}18)`,
        boxShadow: isEgg ? undefined : `0 0 ${size / 4}px ${color}66`,
      }}
    >
      {isEgg ? (
        <span style={{ fontSize: size * 0.55 }}>🥚</span>
      ) : pet.species === 'drache' ? (
        <AnimatedDragon color={color} size={size * 0.82} />
      ) : (
        <span style={{ fontSize: size * 0.55 }}>
          {SPECIES_EMOJI[pet.species!] ?? '🐾'}
        </span>
      )}
      {!isEgg && element && (
        <span
          className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-full bg-white shadow dark:bg-slate-800"
          style={{ width: size * 0.36, height: size * 0.36, fontSize: size * 0.2 }}
          title={element.name}
        >
          {element.emoji}
        </span>
      )}
    </div>
  );
}
