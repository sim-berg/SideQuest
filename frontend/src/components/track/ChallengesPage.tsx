import { Target } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { useAuthStore } from '../../stores/useAuthStore';
import OverlayPage from '../common/OverlayPage';
import { TrackPoolPage } from './TrackPoolPage';

/**
 * Challenges and story arcs, reachable from the hub menu.
 *
 * Follows the same overlay shape as the Menagerie: the pool itself is a plain
 * component so it can also be embedded elsewhere (or routed to later) without
 * dragging the overlay chrome along.
 */
export default function ChallengesPage() {
  const open = useUIStore((s) => s.challengesOpen);
  const closeChallenges = useUIStore((s) => s.closeChallenges);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!open) return null;

  return (
    <OverlayPage
      title="Challenges"
      icon={<Target className="h-6 w-6 text-emerald-500" strokeWidth={2.2} />}
      onClose={closeChallenges}
    >
      {isAuthenticated ? (
        <TrackPoolPage />
      ) : (
        <div className="px-6 py-20 text-center">
          <p className="text-4xl" aria-hidden>
            🎯
          </p>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Melde dich an, um Challenges anzunehmen und deinen Fortschritt zu
            verfolgen.
          </p>
        </div>
      )}
    </OverlayPage>
  );
}
