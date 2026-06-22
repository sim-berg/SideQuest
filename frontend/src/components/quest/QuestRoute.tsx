import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { idFromSlug } from '../../utils/slug';
import { fetchQuestById } from '../../services/quest.service';
import { useQuestStore } from '../../stores/useQuestStore';
import { QuestInfoContent } from './QuestInfoPage';
import type { Quest } from '../../types/quest';

export default function QuestRoute() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const quests = useQuestStore((s) => s.quests);

  const [quest, setQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { navigate('/', { replace: true }); return; }
    const id = idFromSlug(slug);
    if (!id) { navigate('/', { replace: true }); return; }

    const cached = quests.find((q) => q.id === id);
    if (cached) {
      setQuest(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchQuestById(id)
      .then((q) => setQuest(q))
      .catch(() => navigate('/', { replace: true }))
      .finally(() => setLoading(false));
  }, [slug, quests, navigate]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!quest) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900">
      <div className="flex shrink-0 items-center gap-3 px-4 pt-[env(safe-area-inset-top)] pb-2">
        <button
          onClick={() => navigate('/')}
          className="flex h-10 w-10 items-center justify-center rounded-full text-lg text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Zurück"
        >
          ←
        </button>
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Quest Details
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <QuestInfoContent quest={quest} />
      </div>
    </div>
  );
}
