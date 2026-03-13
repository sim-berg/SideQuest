import { cn } from '../../utils/cn';
import { useUIStore } from '../../stores/useUIStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useChatStore } from '../../stores/useChatStore';
import type { ActiveTab } from '../../stores/useUIStore';

const PROTECTED_TABS: ActiveTab[] = ['chat', 'create', 'profile'];

export default function BottomNavBar() {
  const activeTab = useUIStore((s) => s.activeTab);
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const setShowAuthPrompt = useUIStore((s) => s.setShowAuthPrompt);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const totalUnread = useChatStore((s) => s.totalUnread);

  const handleTabClick = (tab: ActiveTab) => {
    if (PROTECTED_TABS.includes(tab) && !isAuthenticated) {
      setShowAuthPrompt(true, tab);
      return;
    }
    setActiveTab(tab);
  };

  const tabs: {
    id: ActiveTab;
    label: string;
    icon: React.FC<{ active: boolean }>;
    badge?: number;
  }[] = [
    { id: 'map', label: 'Karte', icon: MapIcon },
    { id: 'chat', label: 'Chat', icon: ChatIcon, badge: isAuthenticated ? totalUnread : undefined },
    { id: 'create', label: 'Neu', icon: PlusIcon },
    { id: 'profile', label: 'Profil', icon: ProfileIcon },
  ];

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-40 flex items-center justify-around border-t border-slate-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg dark:border-slate-700 dark:bg-slate-900/90">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabClick(tab.id)}
          className={cn(
            'relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
            activeTab === tab.id
              ? 'text-indigo-500'
              : 'text-slate-400 dark:text-slate-500',
          )}
        >
          <tab.icon active={activeTab === tab.id} />
          <span>{tab.label}</span>
          {tab.badge != null && tab.badge > 0 && (
            <span className="absolute top-1 right-1/4 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
              {tab.badge > 99 ? '99+' : tab.badge}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}

function MapIcon({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={active ? 0 : 1.5}
      className="h-6 w-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z"
      />
    </svg>
  );
}

function ChatIcon({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={active ? 0 : 1.5}
      className="h-6 w-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
      />
    </svg>
  );
}

function PlusIcon({ active }: { active: boolean }) {
  return (
    <div
      className={cn(
        'flex h-6 w-6 items-center justify-center rounded-full',
        active
          ? 'bg-indigo-500 text-white'
          : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        className="h-4 w-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 4.5v15m7.5-7.5h-15"
        />
      </svg>
    </div>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={active ? 0 : 1.5}
      className="h-6 w-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
      />
    </svg>
  );
}
