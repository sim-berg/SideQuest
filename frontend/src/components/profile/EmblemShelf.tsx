import { useState } from 'react';
import type { Emblem } from '../../types/achievement';
import EmblemBadge from './EmblemBadge';
import EmblemDetailSheet from './EmblemDetailSheet';

/**
 * A profile's emblems: the pinned few up front, then the whole shelf as small
 * badges. Tapping any of them opens its log — when, where, which side quest.
 */
export default function EmblemShelf({
  emblems,
  featured = [],
  ownerName,
}: {
  emblems: Emblem[];
  featured?: Emblem[];
  ownerName?: string;
}) {
  const [selected, setSelected] = useState<Emblem | null>(null);

  if (!emblems.length) {
    return (
      <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400 dark:bg-slate-800/50">
        Noch keine Embleme gesammelt.
      </p>
    );
  }

  const featuredKeys = new Set(featured.map((e) => e.key));
  const rest = emblems.filter((e) => !featuredKeys.has(e.key));

  return (
    <>
      {featured.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-[10px] font-bold tracking-wide text-slate-400 uppercase">
            Angeheftet
          </p>
          <div className="flex flex-wrap gap-3">
            {featured.map((e) => (
              <button
                key={e.key}
                onClick={() => setSelected(e)}
                className="flex w-16 flex-col items-center gap-1.5 transition-transform hover:-translate-y-0.5"
              >
                <EmblemBadge emblem={e} size="md" />
                <span className="w-full truncate text-center text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  {e.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-[10px] font-bold tracking-wide text-slate-400 uppercase">
          Alle Embleme · {emblems.length}
        </p>
        <div className="flex flex-wrap gap-2">
          {rest.map((e) => (
            <EmblemBadge
              key={e.key}
              emblem={e}
              size="sm"
              onClick={() => setSelected(e)}
            />
          ))}
          {rest.length === 0 && (
            <p className="text-xs text-slate-400">
              Alle Embleme sind angeheftet.
            </p>
          )}
        </div>
      </div>

      {selected && (
        <EmblemDetailSheet
          emblem={selected}
          ownerName={ownerName}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
