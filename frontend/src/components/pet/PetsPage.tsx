import { useEffect } from 'react';
import { PawPrint } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { usePetStore } from '../../stores/usePetStore';
import OverlayPage from '../common/OverlayPage';
import PetDisplay from './PetDisplay';

/**
 * Menagerie page — the companion card that used to live inside the profile,
 * now reachable straight from the hub menu.
 */
export default function PetsPage() {
  const open = useUIStore((s) => s.petsOpen);
  const closePets = useUIStore((s) => s.closePets);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const pets = usePetStore((s) => s.pets);
  const isLoading = usePetStore((s) => s.isLoading);
  const fetchPets = usePetStore((s) => s.fetchPets);

  useEffect(() => {
    if (open && isAuthenticated) void fetchPets();
  }, [open, isAuthenticated, fetchPets]);

  // Losing the session while the page is up closes it.
  useEffect(() => {
    if (open && !isAuthenticated) closePets();
  }, [open, isAuthenticated, closePets]);

  if (!open || !isAuthenticated) return null;

  return (
    <OverlayPage
      title="Pets"
      icon={<PawPrint className="h-6 w-6 text-emerald-500" strokeWidth={2.2} />}
      onClose={closePets}
    >
      {pets.length > 0 ? (
        <PetDisplay />
      ) : (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <span className="text-5xl">{isLoading ? '⏳' : '🥚'}</span>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isLoading
              ? 'Deine Menagerie wird geladen...'
              : 'Noch kein Gefährte. Schließe Quests ab, um dein erstes Ei zu erhalten.'}
          </p>
        </div>
      )}
    </OverlayPage>
  );
}
