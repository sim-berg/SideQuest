import { create } from 'zustand';
import {
  fetchFriends,
  fetchIncomingRequests,
  fetchOutgoingRequests,
} from '../services/friend.service';
import type { FriendRequest } from '../types/friendship';
import type { UserCard } from '../types/user';

interface FriendState {
  friends: UserCard[];
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
  loading: boolean;
  /** Incoming requests waiting for an answer — drives the hub badge. */
  pendingCount: number;
  refresh: () => Promise<void>;
  reset: () => void;
}

export const useFriendStore = create<FriendState>((set) => ({
  friends: [],
  incoming: [],
  outgoing: [],
  loading: false,
  pendingCount: 0,

  refresh: async () => {
    set({ loading: true });
    try {
      const [friends, incoming, outgoing] = await Promise.all([
        fetchFriends(),
        fetchIncomingRequests(),
        fetchOutgoingRequests(),
      ]);
      set({
        friends,
        incoming,
        outgoing,
        pendingCount: incoming.length,
        loading: false,
      });
    } catch {
      // Offline or logged out — keep whatever we had rather than blanking.
      set({ loading: false });
    }
  },

  reset: () =>
    set({ friends: [], incoming: [], outgoing: [], pendingCount: 0 }),
}));
