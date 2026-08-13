import { Shield } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import OverlayPage from '../common/OverlayPage';

/**
 * Placeholder for the upcoming Gilden feature — the hub entry already exists
 * so the slot is visible, the content follows later.
 */
export default function GuildsPage() {
  const open = useUIStore((s) => s.guildsOpen);
  const closeGuilds = useUIStore((s) => s.closeGuilds);

  if (!open) return null;

  return (
    <OverlayPage
      title="Gilden"
      icon={<Shield className="h-6 w-6 text-slate-400" strokeWidth={2.2} />}
      onClose={closeGuilds}
    >
      <div className="mt-16 flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
          <Shield className="h-8 w-8 text-slate-400 dark:text-slate-300" strokeWidth={2} />
        </div>
        <p className="text-base font-bold text-slate-900 dark:text-white">
          Gilden entstehen gerade
        </p>
        <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400">
          Schließe dich bald mit anderen Abenteurern zusammen: gemeinsame
          Quests, Gilden-Bestenlisten und geteilte Beute.
        </p>
        <span className="mt-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold tracking-wide text-slate-500 uppercase dark:bg-slate-800 dark:text-slate-300">
          Bald verfügbar
        </span>
      </div>
    </OverlayPage>
  );
}
