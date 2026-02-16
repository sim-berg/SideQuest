import { useUIStore } from '../../stores/useUIStore';

export default function NewQuestFAB() {
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const activeTab = useUIStore((s) => s.activeTab);

  if (activeTab !== 'map') return null;

  return (
    <button
      onClick={() => setActiveTab('create')}
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
