import { BookOpen } from 'lucide-react';
import { useLogbookStore } from '../../stores/useLogbookStore';
import { useUIStore } from '../../stores/useUIStore';
import { useAuthStore } from '../../stores/useAuthStore';

export default function LogbookFAB() {
  const openLogbook = useLogbookStore((s) => s.openLogbook);
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
    openLogbook();
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/30 transition-all hover:bg-amber-600 hover:shadow-xl active:scale-95"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Logbuch öffnen"
    >
      <BookOpen className="h-7 w-7" strokeWidth={2.2} />
    </button>
  );
}
