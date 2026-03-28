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

  // Show dragon selection overlay for authenticated users without a dragon
  useEffect(() => {
    if (isAuthenticated && user && user.hasDragon === false) {
      setShowDragonSelection(true);
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

      {/* Location Indicator - always visible */}
      {isAuthenticated && user && activeTab === 'map' && (
        <button
          onClick={() => {
            const newValue = !user.shareLocation;
            api.patch('/users/me', { shareLocation: newValue })
              .then(() => updateUser({ shareLocation: newValue }))
              .catch(() => {});
          }}
          className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all backdrop-blur-md ${
            user.shareLocation
              ? 'bg-green-500/30 text-green-700 border border-green-500/50 dark:text-green-300 dark:border-green-500/30'
              : 'bg-red-500/30 text-red-700 border border-red-500/50 dark:text-red-300 dark:border-red-500/30'
          }`}
        >
          <span className="text-lg">{user.shareLocation ? '📍' : '📍'}</span>
          <span>{user.shareLocation ? 'Standort aktiv' : 'Kein Standort'}</span>
        </button>
      )}

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
