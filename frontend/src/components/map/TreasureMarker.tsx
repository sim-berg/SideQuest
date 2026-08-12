import { useCallback } from 'react';
import { motion } from 'motion/react';
import type { TreasureSpawn } from '../../types/treasure';
import { RARITY_META } from '../../constants/treasures';
import { useTreasureStore } from '../../stores/useTreasureStore';

interface TreasureMarkerProps {
  spawn: TreasureSpawn;
  /** Play the spawn-pop animation (first time this chest appears). */
  isNew: boolean;
}

/**
 * Treasure chest on the map. The ring color and glow encode the rarity;
 * epic and legendary chests sparkle so they read as "run, before it's gone".
 */
export default function TreasureMarker({ spawn, isNew }: TreasureMarkerProps) {
  const setSelected = useTreasureStore((s) => s.setSelected);
  const meta = RARITY_META[spawn.rarity];
  const isShiny = meta.tier >= 3;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelected(spawn);
    },
    [spawn, setSelected],
  );

  return (
    <button
      onClick={handleClick}
      className="relative flex cursor-pointer items-center justify-center"
      aria-label={`Schatz: ${spawn.item.name} (${meta.label})`}
    >
      {/* Rarity aura */}
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: meta.color }}
        animate={{ scale: [1, 2, 1], opacity: [0.45, 0, 0.45] }}
        transition={{
          duration: isShiny ? 1.2 : 2.4,
          repeat: Infinity,
          ease: 'easeOut',
        }}
      />

      {/* Chest body — drop-in pop on first appearance */}
      <motion.div
        initial={isNew ? { scale: 0, y: -28 } : false}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 450, damping: 16 }}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-lg"
        style={{
          borderColor: meta.color,
          boxShadow: `0 0 14px ${meta.color}88`,
          background: `radial-gradient(circle at 30% 30%, #78350f, #451a03)`,
        }}
      >
        <span className="text-lg drop-shadow">🧰</span>

        {/* Rarity gem badge */}
        <span
          className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full ring-2 ring-white dark:ring-slate-900"
          style={{ backgroundColor: meta.color }}
        />

        {isShiny && (
          <motion.span
            className="absolute -left-2 -top-2 text-sm"
            animate={{ scale: [1, 1.4, 1], rotate: [0, 20, -20, 0] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            ✨
          </motion.span>
        )}
      </motion.div>
    </button>
  );
}
