import { cn } from '../../utils/cn';
import { useUIStore } from '../../stores/useUIStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useChatStore } from '../../stores/useChatStore';
import type { ActiveTab } from '../../stores/useUIStore';

const PROTECTED_TABS: ActiveTab[] = ['chat', 'create', 'profile', 'rpg', 'dungeon'];

interface TabDef {
  id: ActiveTab;
  label: string;
  icon: React.FC<{ active: boolean }>;
  badge?: number;
}

export default function BottomNavBar() {
  const activeTab        = useUIStore((s) => s.activeTab);
  const setActiveTab     = useUIStore((s) => s.setActiveTab);
  const setShowAuthPrompt = useUIStore((s) => s.setShowAuthPrompt);
  const pickingLocation  = useUIStore((s) => s.pickingLocation);
  const createWizardStep = useUIStore((s) => s.createWizardStep);
  const dungeonGameActive = useUIStore((s) => s.dungeonGameActive);
  const isAuthenticated  = useAuthStore((s) => s.isAuthenticated);
  const totalUnread      = useChatStore((s) => s.totalUnread);

  if (pickingLocation || createWizardStep > 0 || dungeonGameActive) return null;

  const handleTabClick = (tab: ActiveTab) => {
    if (PROTECTED_TABS.includes(tab) && !isAuthenticated) {
      setShowAuthPrompt(true, tab);
      return;
    }
    setActiveTab(tab);
  };

  const tabs: TabDef[] = [
    { id: 'map',     label: 'Karte',       icon: MapIcon },
    { id: 'rpg',     label: 'Abenteuer',   icon: RpgIcon },
    { id: 'dungeon', label: 'Kerker',       icon: DungeonIcon },
    { id: 'chat',    label: 'Nachrichten', icon: ChatIcon, badge: isAuthenticated ? totalUnread : undefined },
    { id: 'profile', label: 'Profil',      icon: ProfileIcon },
  ];

  const activeTabIndex = tabs.findIndex((t) => t.id === activeTab);

  return (
    <nav
      className="fixed right-0 bottom-0 left-0 z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Thin arch border */}
      <div className="relative w-full h-5 overflow-hidden">
        <div
          className="absolute inset-0 bg-repeat-x"
          style={{ backgroundImage: 'url(/menu/border_top.png)', backgroundSize: 'auto 20px', backgroundPosition: 'center top' }}
        />
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-300"
          style={{
            background: `radial-gradient(ellipse 24% 100% at ${activeTabIndex * 20 + 10}% 50%, rgba(220,170,30,0.6) 0%, rgba(180,130,20,0.25) 45%, transparent 75%)`,
            mixBlendMode: 'screen',
          }}
        />
      </div>

      {/* Main bar */}
      <div
        className="relative flex items-center justify-around px-1 py-0.5"
        style={{
          background: 'linear-gradient(180deg, #1c1608 0%, #0e0c04 60%, #0a0802 100%)',
          borderTop: '1px solid #5a4a1a',
          boxShadow: 'inset 0 1px 0 rgba(200,170,60,0.12)',
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className="relative flex flex-1 flex-col items-center gap-0 py-1"
              style={{ minWidth: 0 }}
            >
              {isActive && (
                <span
                  className="absolute inset-0 rounded-sm"
                  style={{
                    background: 'radial-gradient(ellipse at 50% 40%, rgba(200,160,40,0.18) 0%, transparent 70%)',
                    border: '1px solid rgba(200,160,40,0.2)',
                  }}
                />
              )}
              <span
                className="relative"
                style={{
                  filter: isActive
                    ? 'drop-shadow(0 0 5px rgba(220,180,40,0.9)) brightness(1.15)'
                    : 'brightness(0.5) sepia(0.3)',
                  transition: 'filter 0.2s',
                }}
              >
                <tab.icon active={isActive} />
              </span>
              <span
                className="relative text-[8px] font-semibold tracking-wider uppercase leading-none"
                style={{
                  fontFamily: '"Georgia", "Times New Roman", serif',
                  color: isActive ? '#d4a832' : '#6b5a2a',
                  textShadow: isActive ? '0 0 8px rgba(220,180,40,0.6)' : 'none',
                  letterSpacing: '0.05em',
                }}
              >
                {tab.label}
              </span>
              {tab.badge != null && tab.badge > 0 && (
                <span
                  className="absolute top-0 right-1/4 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-1 text-[8px] font-bold text-white"
                  style={{ background: '#8b1a1a', border: '1px solid #c43a3a' }}
                >
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </button>
          );
        })}
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="absolute top-1.5 bottom-1.5 w-px"
            style={{
              left: `${i * 20}%`,
              background: 'linear-gradient(180deg, transparent, rgba(180,140,40,0.2) 40%, rgba(180,140,40,0.2) 60%, transparent)',
            }}
          />
        ))}
      </div>
    </nav>
  );
}

// ─── Icons — PNG assets with fallback SVGs ────────────────────────────────────

function MapIcon({ active }: { active: boolean }) {
  return (
    <img
      src="/menu/icon_map.png"
      alt="Karte"
      className={cn('h-6 w-6 object-contain', active ? 'opacity-100' : 'opacity-80')}
      draggable={false}
    />
  );
}

function RpgIcon({ active }: { active: boolean }) {
  return (
    <img
      src="/menu/icon_rpg.png"
      alt="Abenteuer"
      className={cn('h-6 w-6 object-contain', active ? 'opacity-100' : 'opacity-80')}
      draggable={false}
    />
  );
}

function DungeonIcon({ active }: { active: boolean }) {
  return (
    <img
      src="/menu/icon_dungeon.png"
      alt="Kerker"
      className={cn('h-6 w-6 object-contain', active ? 'opacity-100' : 'opacity-80')}
      draggable={false}
    />
  );
}

function ChatIcon({ active }: { active: boolean }) {
  return (
    <img
      src="/menu/icon_chat.png"
      alt="Nachrichten"
      className={cn('h-6 w-6 object-contain', active ? 'opacity-100' : 'opacity-80')}
      draggable={false}
    />
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  // No matching item PNG — draw a medieval shield SVG
  return (
    <svg
      viewBox="0 0 32 38"
      className="h-6 w-6"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shield body */}
      <path
        d="M16 2 L30 8 L30 20 C30 29 16 36 16 36 C16 36 2 29 2 20 L2 8 Z"
        fill={active ? '#8b6914' : '#3a2e0a'}
        stroke={active ? '#d4a832' : '#5a4a1a'}
        strokeWidth="1.5"
      />
      {/* Gothic trefoil ornament */}
      <circle cx="16" cy="13" r="3.5" fill={active ? '#d4a832' : '#5a4a1a'} />
      <circle cx="11" cy="17" r="2.5" fill={active ? '#d4a832' : '#5a4a1a'} />
      <circle cx="21" cy="17" r="2.5" fill={active ? '#d4a832' : '#5a4a1a'} />
      {/* Center gem */}
      <circle cx="16" cy="13" r="1.5" fill={active ? '#fff8d0' : '#8b6914'} />
      {/* Bottom point accent */}
      <path
        d="M13 22 L16 30 L19 22"
        stroke={active ? '#d4a832' : '#5a4a1a'}
        strokeWidth="1.2"
        fill="none"
      />
    </svg>
  );
}
