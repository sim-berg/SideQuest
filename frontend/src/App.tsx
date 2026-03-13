import { useEffect } from 'react';
import { MapProvider } from 'react-map-gl/maplibre';
import AppShell from './components/layout/AppShell';
import QuestMap from './components/map/QuestMap';
import QuestBottomSheet from './components/quest/BottomSheet';
import QuestInfoPage from './components/quest/QuestInfoPage';
import CreateQuestPage from './components/quest/CreateQuestPage';
import AuthPrompt from './components/auth/AuthPrompt';
import TopNavBar from './components/navigation/TopNavBar';
import NewQuestFAB from './components/navigation/NewQuestFAB';
import ChatInbox from './components/chat/ChatInbox';
import ChatView from './components/chat/ChatView';
import ProfilePage from './components/profile/ProfilePage';
import { useUserLocation } from './hooks/useUserLocation';
import { useRealtimeMessages } from './hooks/useRealtimeMessages';
import { useQuestStore } from './stores/useQuestStore';
import { useAuthStore } from './stores/useAuthStore';
import { useUIStore } from './stores/useUIStore';
import { useMapStore } from './stores/useMapStore';
import { fetchQuests } from './services/quest.service';
import { refreshToken } from './services/auth.service';
import { getUnreadCount } from './services/message.service';
import { useChatStore } from './stores/useChatStore';

function ChatViewWrapper() {
  const activeChat = useChatStore((s) => s.activeChat);
  if (!activeChat) return null;
  return <ChatView />;
}

function AppContent() {
  useUserLocation();
  useRealtimeMessages();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setAuth = useAuthStore((s) => s.setAuth);
  const setQuests = useQuestStore((s) => s.setQuests);
  const setLoading = useQuestStore((s) => s.setLoading);
  const locationError = useMapStore((s) => s.locationError);
  const activeTab = useUIStore((s) => s.activeTab);
  const setTotalUnread = useChatStore((s) => s.setTotalUnread);

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

  // Fetch unread count only when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    getUnreadCount()
      .then((r) => setTotalUnread(r.count))
      .catch(() => {});
  }, [isAuthenticated, setTotalUnread]);

  return (
    <AppShell>
      {/* Map tab - always rendered but hidden when other tabs active */}
      <div className={activeTab === 'map' ? 'h-full w-full' : 'hidden'}>
        <div className="h-full w-full">
          <QuestMap />
        </div>
        <QuestBottomSheet />

        {/* Location error banner */}
        {locationError && (
          <div className="fixed bottom-20 left-4 right-4 z-20 rounded-lg bg-amber-100 px-4 py-2 text-center text-sm text-amber-800 shadow-md dark:bg-amber-900/30 dark:text-amber-300">
            Standort nicht verfuegbar - Entfernungsfilter deaktiviert
          </div>
        )}
      </div>

      {/* Chat tab */}
      {activeTab === 'chat' && <ChatInbox />}

      {/* Create tab */}
      {activeTab === 'create' && <CreateQuestPage />}

      {/* Profile tab */}
      {activeTab === 'profile' && <ProfilePage />}

      {/* Overlay pages */}
      <QuestInfoPage />
      <ChatViewWrapper />

      {/* Auth prompt overlay */}
      <AuthPrompt />

      {/* Top Navigation */}
      <TopNavBar />

      {/* New Quest FAB */}
      <NewQuestFAB />
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
