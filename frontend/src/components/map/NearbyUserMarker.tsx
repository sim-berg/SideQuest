import { useState } from 'react';
import { Marker } from 'react-map-gl/maplibre';
import type { NearbyUser } from '../../stores/useNearbyUsersStore';
import { useChatStore } from '../../stores/useChatStore';

interface Props {
  user: NearbyUser;
}

export default function NearbyUserMarker({ user }: Props) {
  const [showTooltip, setShowTooltip] = useState(false);
  const openChat = useChatStore((s) => s.openChat);
  const ensureConversation = useChatStore((s) => s.ensureConversation);
  const initial = (user.displayName || user.username).charAt(0).toUpperCase();

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    ensureConversation({
      id: user.userId,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      isOnline: true,
    });
    openChat(user.userId);
    setShowTooltip(false);
  };

  return (
    <Marker longitude={user.lng} latitude={user.lat}>
      <div
        className="relative flex cursor-pointer items-center justify-center"
        onClick={() => setShowTooltip((v) => !v)}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow-lg">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <span className="text-xs font-bold text-white">{initial}</span>
          )}
        </div>

        {showTooltip && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg">
            <div className="mb-1.5 whitespace-nowrap text-center">
              <span className="font-semibold">{user.displayName || user.username}</span>
              <span className="ml-1.5 text-emerald-300">Lv.{user.level}</span>
            </div>
            <button
              onClick={handleMessage}
              className="w-full rounded-md bg-indigo-500 px-3 py-1 text-[11px] font-medium text-white transition-colors hover:bg-indigo-600"
            >
              Nachricht senden
            </button>
          </div>
        )}
      </div>
    </Marker>
  );
}
