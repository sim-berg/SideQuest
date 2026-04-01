import { useUIStore } from '../../stores/useUIStore';
import { useAuthStore } from '../../stores/useAuthStore';

export default function NewQuestFAB() {
  const startPickingLocation = useUIStore((s) => s.startPickingLocation);
  const setShowAuthPrompt    = useUIStore((s) => s.setShowAuthPrompt);
  const activeTab            = useUIStore((s) => s.activeTab);
  const pickingLocation      = useUIStore((s) => s.pickingLocation);
  const createQuestOpen      = useUIStore((s) => s.createQuestOpen);
  const isAuthenticated      = useAuthStore((s) => s.isAuthenticated);

  if (activeTab !== 'map' || pickingLocation || (createQuestOpen && !pickingLocation)) return null;

  const handleClick = () => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true, 'create');
      return;
    }
    startPickingLocation();
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Neue Quest erstellen"
      className="fixed z-30 flex items-center gap-2 active:scale-95 transition-transform"
      style={{
        right: '16px',
        bottom: 'calc(env(safe-area-inset-bottom) + 130px)',
        background: 'linear-gradient(180deg, #2a1f08 0%, #1a1204 100%)',
        borderRadius: '2px',
        padding: '10px 18px 10px 14px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.7), 0 0 16px rgba(180,130,0,0.3), inset 0 1px 0 rgba(220,180,60,0.2)',
        border: '1px solid rgba(180,130,20,0.5)',
        fontFamily: 'Georgia, serif',
      }}
    >
      {/* Scroll icon */}
      <span
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center"
        style={{
          background: 'rgba(180,130,20,0.15)',
          border: '1px solid rgba(180,130,20,0.3)',
          borderRadius: '2px',
        }}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="#d4a832" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </span>

      {/* Label */}
      <span
        className="text-sm font-semibold"
        style={{ color: '#d4a832', letterSpacing: '0.05em', textShadow: '0 0 8px rgba(180,130,0,0.5)' }}
      >
        Quest erstellen
      </span>

      {/* Corner ornaments */}
      <span className="absolute top-0.5 left-1 text-[8px]" style={{ color: 'rgba(180,130,20,0.5)' }}>✦</span>
      <span className="absolute top-0.5 right-1 text-[8px]" style={{ color: 'rgba(180,130,20,0.5)' }}>✦</span>
    </button>
  );
}
