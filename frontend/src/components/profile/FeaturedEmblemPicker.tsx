import type { Emblem } from '../../types/achievement';
import EmblemBadge from './EmblemBadge';
import { cn } from '../../utils/cn';

const MAX_FEATURED = 6;

/**
 * Pick which emblems sit at the top of the profile. Selection order is kept —
 * the first one tapped is the first one shown.
 */
export default function FeaturedEmblemPicker({
  emblems,
  selected,
  onChange,
}: {
  emblems: Emblem[];
  selected: string[];
  onChange: (keys: string[]) => void;
}) {
  const toggle = (key: string) => {
    if (selected.includes(key)) {
      onChange(selected.filter((k) => k !== key));
    } else if (selected.length < MAX_FEATURED) {
      onChange([...selected, key]);
    }
  };

  if (!emblems.length) {
    return (
      <p className="rounded-xl bg-slate-50 px-4 py-4 text-center text-xs text-slate-400 dark:bg-slate-800/50">
        Sobald du Embleme sammelst, kannst du sie hier anheften.
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {emblems.map((e) => {
          const rank = selected.indexOf(e.key);
          const isSelected = rank >= 0;
          const full = selected.length >= MAX_FEATURED && !isSelected;
          return (
            <button
              key={e.key}
              onClick={() => toggle(e.key)}
              disabled={full}
              title={e.title}
              className={cn(
                'relative rounded-full p-0.5 transition-all',
                isSelected && 'ring-2 ring-indigo-500',
                full && 'opacity-30',
              )}
            >
              <EmblemBadge emblem={e} size="md" />
              {isSelected && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">
                  {rank + 1}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-400">
        {selected.length}/{MAX_FEATURED} angeheftet — die Reihenfolge ist die
        Reihenfolge deiner Auswahl.
      </p>
    </div>
  );
}
