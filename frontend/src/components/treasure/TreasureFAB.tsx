import { Gem } from 'lucide-react';
import { useTreasureStore } from '../../stores/useTreasureStore';
import { useUIStore } from '../../stores/useUIStore';
import { useAuthStore } from '../../stores/useAuthStore';

/** Opens the Schatzkammer — sits directly above the Logbook FAB. */
export default function TreasureFAB() {
  const openTreasury = useTreasureStore((s) => s.openTreasury);
  const activeTab = useUIStore((s) => s.activeTab);
  const pickingLocation = useUIStore((s) => s.pickingLocation);
  const setShowAuthPrompt = useUIStore((s) => s.setShowAuthPrompt);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (activeTab !== 'map' || pickingLocation) return null;

  const handleClick = () => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }
    openTreasury();
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-24 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500 text-white shadow-lg shadow-purple-500/30 transition-all hover:bg-purple-600 hover:shadow-xl active:scale-95"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Schatzkammer öffnen"
    >
      <Gem className="h-7 w-7" strokeWidth={2.2} />
    </button>
  );
}
