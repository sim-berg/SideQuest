import { create } from 'zustand';
import type { Comment } from '../types/comment';
import { fetchComments } from '../services/comment.service';

interface CommentState {
  byQuest: Record<string, Comment[]>;
  loading: boolean;
  fetchFor: (questId: string) => Promise<void>;
  addComment: (questId: string, c: Comment) => void;
}

export const useCommentStore = create<CommentState>((set, get) => ({
  byQuest: {},
  loading: false,
  fetchFor: async (questId) => {
    set({ loading: true });
    try {
      const comments = await fetchComments(questId);
      set({ byQuest: { ...get().byQuest, [questId]: comments } });
    } catch {
      // ignore
    } finally {
      set({ loading: false });
    }
  },
  addComment: (questId, c) => {
    const existing = get().byQuest[questId] ?? [];
    set({ byQuest: { ...get().byQuest, [questId]: [...existing, c] } });
  },
}));
