import { useUIStore } from '../../stores/useUIStore';
import { useAuthStore } from '../../stores/useAuthStore';

export default function NewQuestFAB() {
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const setShowAuthPrompt = useUIStore((s) => s.setShowAuthPrompt);
  const activeTab = useUIStore((s) => s.activeTab);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (activeTab !== 'map') return null;

  const handleClick = () => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true, 'create');
      return;
    }
    setActiveTab('create');
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 left-6 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-600 hover:shadow-xl hover:shadow-indigo-500/40 active:scale-95"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Neue Quest erstellen"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        className="h-7 w-7"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 4.5v15m7.5-7.5h-15"
        />
      </svg>
    </button>
  );
}
