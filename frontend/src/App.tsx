import { useEffect, useState } from 'react';
import { MapProvider } from 'react-map-gl/maplibre';
import AppShell from './components/layout/AppShell';
import QuestMap from './components/map/QuestMap';
import QuestBottomSheet from './components/quest/BottomSheet';
import QuestInfoPage from './components/quest/QuestInfoPage';
import CreateQuestPage from './components/quest/CreateQuestPage';
import AuthPrompt from './components/auth/AuthPrompt';
import DragonSelection from './components/dragon/DragonSelection';
import TopNavBar from './components/navigation/TopNavBar';
import NewQuestFAB from './components/navigation/NewQuestFAB';
import ToastContainer from './components/common/ToastContainer';
import ChatInbox from './components/chat/ChatInbox';
import ChatView from './components/chat/ChatView';
import ProfilePage from './components/profile/ProfilePage';
import PrivacyPage from './components/legal/PrivacyPage';
import ImpressumPage from './components/legal/ImpressumPage';
import { useUserLocation } from './hooks/useUserLocation';
import { useRealtimeMessages } from './hooks/useRealtimeMessages';
import { useQuestStore } from './stores/useQuestStore';
import { useAuthStore } from './stores/useAuthStore';
import { useUIStore } from './stores/useUIStore';
import { useDragonStore } from './stores/useDragonStore';
import { fetchQuests, fetchDailyQuests } from './services/quest.service';
import { refreshToken } from './services/auth.service';
import { getUnreadCount } from './services/message.service';
import { useChatStore } from './stores/useChatStore';
import { useToastStore } from './stores/useToastStore';
import { api } from './services/api';

function ChatViewWrapper() {
  const activeChat = useChatStore((s) => s.activeChat);
  if (!activeChat) return null;
  return <ChatView />;
}

function AppContent() {
  useUserLocation();
  useRealtimeMessages();
  const [currentPage, setCurrentPage] = useState<string | null>(null);

  // Handle hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      setCurrentPage(hash || null);
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const setQuests = useQuestStore((s) => s.setQuests);
  const setDailyQuests = useQuestStore((s) => s.setDailyQuests);
  const setLoading = useQuestStore((s) => s.setLoading);
  const updateUser = useAuthStore((s) => s.updateUser);
  const addToast = useToastStore((s) => s.addToast);
  const activeTab = useUIStore((s) => s.activeTab);
  const setShowDragonSelection = useUIStore((s) => s.setShowDragonSelection);
  const setTotalUnread = useChatStore((s) => s.setTotalUnread);
  const fetchDragon = useDragonStore((s) => s.fetchDragon);

  // Silent refresh on mount — non-blocking, app works without auth
  useEffect(() => {
    refreshToken()
      .then((res) => setAuth(res.user, res.accessToken))
      .catch(() => {});
  }, [setAuth]);

  useEffect(() => {
    setLoading(true);
    fetchQuests()
      .then(setQuests)
      .finally(() => setLoading(false));
  }, [setQuests, setLoading]);

  // Fetch daily quests and show toast on first load
  useEffect(() => {
    fetchDailyQuests()
      .then((dailyQuests) => {
        setDailyQuests(dailyQuests);

        // Show random daily quest as toast on first load
        const today = new Date().toISOString().split('T')[0];
        const storageKey = `sidequest-daily-shown-${today}`;
        if (!localStorage.getItem(storageKey) && dailyQuests.length > 0) {
          const randomQuest =
            dailyQuests[Math.floor(Math.random() * dailyQuests.length)];
          addToast({
            type: 'quest',
            title: randomQuest.title,
            message: randomQuest.description,
            duration: 8000,
          });
          localStorage.setItem(storageKey, 'true');
        }
      })
      .catch(() => {});
  }, [setDailyQuests, addToast]);

  // Fetch unread count only when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    getUnreadCount()
      .then((r) => setTotalUnread(r.count))
      .catch(() => {});
  }, [isAuthenticated, setTotalUnread]);

  // Fetch dragon when authenticated and user has a dragon
  useEffect(() => {
    if (isAuthenticated && user?.hasDragon) {
      fetchDragon();
    }
  }, [isAuthenticated, user?.hasDragon, fetchDragon]);

  // Show dragon selection overlay only on initial login (not on reload)
  useEffect(() => {
    if (isAuthenticated && user && user.hasDragon === false) {
      const shown = sessionStorage.getItem(`dragon-selection-shown-${user.id}`);
      if (!shown) {
        setShowDragonSelection(true);
        sessionStorage.setItem(`dragon-selection-shown-${user.id}`, 'true');
      }
    }
  }, [isAuthenticated, user?.hasDragon, user?.id, setShowDragonSelection]);

  // Show legal pages if in hash route
  if (currentPage === '/datenschutz') {
    return <PrivacyPage />;
  }
  if (currentPage === '/impressum') {
    return <ImpressumPage />;
  }

  return (
    <AppShell>
      {/* Map - always visible in background */}
      <div className="h-full w-full">
        <QuestMap />
      </div>
      <QuestBottomSheet />

      {/* Bottom center controls - responsive layout */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex flex-row items-center justify-center gap-3 md:gap-6 text-xs md:text-sm font-semibold backdrop-blur-md bg-white/20 dark:bg-slate-900/20 rounded-full px-3 md:px-6 py-2 md:py-3 border border-white/30 dark:border-slate-700/30">
        {/* Location Status */}
        {isAuthenticated && user && activeTab === 'map' && (
          <button
            onClick={async () => {
              try {
                const newValue = !user.shareLocation;
                const response = await api.patch<{ shareLocation: boolean }>('/users/me', { shareLocation: newValue });
                updateUser({ shareLocation: response.shareLocation });
              } catch (error) {
                console.error('Failed to update location sharing:', error);
                addToast({
                  type: 'error',
                  title: 'Error',
                  message: 'Failed to update location sharing',
                  duration: 3000,
                });
              }
            }}
            className={`transition-colors cursor-pointer hover:opacity-80 whitespace-nowrap ${
              user.shareLocation
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            📍 <span className="hidden sm:inline">{user.shareLocation ? 'Standort aktiv' : 'Standort inaktiv'}</span>
            <span className="sm:hidden">{user.shareLocation ? 'Aktiv' : 'Inaktiv'}</span>
          </button>
        )}

        {/* Separator */}
        {isAuthenticated && user && activeTab === 'map' && (
          <span className="text-slate-400 dark:text-slate-500">•</span>
        )}

        {/* Legal Links */}
        <div className="flex items-center justify-center gap-2 md:gap-3">
          <a href="/#/datenschutz" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer whitespace-nowrap">
            <span className="hidden sm:inline">Datenschutz</span>
            <span className="sm:hidden">Daten</span>
          </a>
          <span className="text-slate-400 dark:text-slate-500">•</span>
          <a href="/#/impressum" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer whitespace-nowrap">
            <span className="hidden sm:inline">Impressum</span>
            <span className="sm:hidden">Info</span>
          </a>
        </div>
      </div>

      {/* Chat tab - overlay on map */}
      {activeTab === 'chat' && <ChatInbox />}

      {/* Profile tab - overlay on map */}
      {activeTab === 'profile' && <ProfilePage />}

      {/* Overlay pages */}
      <QuestInfoPage />
      <ChatViewWrapper />

      {/* Quest creation wizard (bottom sheet overlay on map) */}
      <CreateQuestPage />

      {/* Auth prompt overlay */}
      <AuthPrompt />

      {/* Dragon selection overlay */}
      <DragonSelection />

      {/* Top Navigation */}
      <TopNavBar />

      {/* New Quest FAB */}
      <NewQuestFAB />

      {/* Toast Container */}
      <ToastContainer />
    </AppShell>
  );
}

export default function App() {
  return (
    <MapProvider>
      <AppContent />
    </MapProvider>
  );
}
