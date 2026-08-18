import { Plus, Trash2 } from 'lucide-react';
import type { ProfileLink } from '../../types/user';

const MAX_LINKS = 8;

/** Guess an icon hint from the host, so most links label themselves. */
function iconForUrl(url: string): string {
  const host = url.replace(/^https?:\/\//i, '').split('/')[0].toLowerCase();
  if (host.includes('instagram')) return 'instagram';
  if (host.includes('github')) return 'github';
  if (host.includes('youtube') || host.includes('youtu.be')) return 'youtube';
  if (host.includes('spotify')) return 'spotify';
  if (host.includes('mastodon') || host.includes('bsky')) return 'social';
  return 'web';
}

/**
 * Editor for the links a user puts on their profile. Only http(s) is accepted
 * (the backend enforces the same rule) — a javascript: URL must never reach
 * another visitor's click.
 */
export default function ProfileLinksEditor({
  links,
  onChange,
}: {
  links: ProfileLink[];
  onChange: (links: ProfileLink[]) => void;
}) {
  const update = (i: number, patch: Partial<ProfileLink>) => {
    const next = links.map((l, idx) => (idx === i ? { ...l, ...patch } : l));
    if (patch.url !== undefined) next[i].icon = iconForUrl(patch.url);
    onChange(next);
  };

  const invalid = (url: string) => !!url && !/^https?:\/\/\S+$/i.test(url);

  return (
    <div className="flex flex-col gap-2">
      {links.map((link, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={link.label}
            onChange={(e) => update(i, { label: e.target.value })}
            maxLength={40}
            placeholder="Titel"
            className="w-28 shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <input
            value={link.url}
            onChange={(e) => update(i, { url: e.target.value })}
            maxLength={300}
            placeholder="https://..."
            className={`min-w-0 flex-1 rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:bg-slate-800 dark:text-white ${
              invalid(link.url)
                ? 'border-red-400'
                : 'border-slate-200 dark:border-slate-700'
            }`}
          />
          <button
            onClick={() => onChange(links.filter((_, idx) => idx !== i))}
            aria-label="Link entfernen"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      {links.length < MAX_LINKS && (
        <button
          onClick={() =>
            onChange([...links, { label: '', url: '', icon: 'web' }])
          }
          className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 py-2.5 text-sm font-semibold text-slate-400 transition-colors hover:border-indigo-400 hover:text-indigo-500 dark:border-slate-700"
        >
          <Plus className="h-4 w-4" />
          Link hinzufügen
        </button>
      )}
    </div>
  );
}
