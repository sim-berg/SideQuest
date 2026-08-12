import { useEffect, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { idFromSlug } from '../../utils/slug';
import { fetchQuestById } from '../../services/quest.service';
import { useQuestStore } from '../../stores/useQuestStore';
import { useSideQuestStore } from '../../stores/useSideQuestStore';
import { useToastStore } from '../../stores/useToastStore';
import type { Quest } from '../../types/quest';

/**
 * Landing point for shared links (`/quest/:slug`).
 *
 * Headless: it resolves the slug to a quest, hands it to the matching store and
 * opens the regular detail screen, then rewrites the URL back to `/`. A shared
 * link therefore drops the visitor straight into the normal app flow — with
 * Route / Kompass / Annehmen — rather than a separate read-only page.
 */
export default function QuestRoute() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const showToast = useToastStore((s) => s.showToast);

  /** Guards against re-resolving the same link when the component re-renders. */
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (!slug || handled.current === slug) return;
    handled.current = slug;

    const id = idFromSlug(slug);
    if (!id) {
      showToast('Ungültiger Quest-Link');
      navigate('/', { replace: true });
      return;
    }

    const open = (quest: Quest) => {
      if (quest.isSideQuest) {
        const store = useSideQuestStore.getState();
        store.updateSideQuestInList(quest); // make sure it's on the map too
        store.setSelected(quest);
        store.openDetail();
      } else {
        const store = useQuestStore.getState();
        store.selectQuest(quest);
        store.openDetail();
      }
      navigate('/', { replace: true });
    };

    // Prefer a copy we already hold so the screen opens without a round trip.
    const cached = [
      ...useQuestStore.getState().quests,
      ...useSideQuestStore.getState().sideQuests,
    ].find((q) => q.id === id);

    if (cached) {
      open(cached);
      return;
    }

    fetchQuestById(id)
      .then(open)
      .catch(() => {
        showToast('Quest nicht gefunden');
        navigate('/', { replace: true });
      });
  }, [slug, navigate, showToast]);

  // Resolving always ends in navigate('/'), which unmounts this route — so the
  // spinner is simply what's on screen for as long as we're still working.
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white dark:bg-slate-900">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
    </div>
  );
}
