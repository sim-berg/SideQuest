import {
  ArrowLeft,
  Route,
  Compass,
  Swords,
  CircleCheck,
  Flag,
  Share2,
  MapPin,
  Coins,
  Zap,
  Clock,
  User,
} from 'lucide-react';
import { useQuestStore } from '../../stores/useQuestStore';
import { useQuestActions } from '../../hooks/useQuestActions';
import { useQuestDistance } from '../../hooks/useQuestDistance';
import { CATEGORY_META } from '../../constants/categories';
import { DIFFICULTY_META } from '../../constants/difficulty';
import { formatDistance, formatTimeRemaining } from '../../utils/format';
import RoundActionButton from '../sidequest/RoundActionButton';
import CommentSection from '../sidequest/CommentSection';
import type { LucideIcon } from 'lucide-react';

function InfoChip({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 dark:bg-slate-800">
      <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
        {text}
      </span>
    </div>
  );
}

export default function QuestDetailScreen() {
  const quest = useQuestStore((s) => s.selectedQuest);
  const detailOpen = useQuestStore((s) => s.detailOpen);
  const closeDetail = useQuestStore((s) => s.closeDetail);

  const {
    loading,
    error,
    isAcceptedByMe,
    accept,
    complete,
    abandon,
    planRoute,
    openCompass,
    share,
  } = useQuestActions(quest);
  const distance = useQuestDistance(quest?.lat ?? 0, quest?.lng ?? 0);

  if (!quest || !detailOpen) return null;

  const meta = CATEGORY_META[quest.category];
  const diff = DIFFICULTY_META[quest.difficulty ?? 'medium'];

  return (
    <div className="fixed inset-0 z-[95] flex flex-col bg-white dark:bg-slate-900">
      {/* top bar */}
      <div className="flex shrink-0 items-center gap-3 px-4 pb-2 pt-[calc(env(safe-area-inset-top)+0.5rem)]">
        <button
          onClick={closeDetail}
          className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Zurück"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Quest
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pb-10">
        {/* hero */}
        <div
          className="px-5 py-6"
          style={{
            background: `linear-gradient(160deg, ${meta.color}26, transparent)`,
          }}
        >
          <div className="mb-2 flex items-center gap-2">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl"
              style={{ backgroundColor: `${meta.color}33` }}
            >
              {meta.icon}
            </span>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-white"
              style={{ backgroundColor: meta.color }}
            >
              {meta.label}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {quest.title}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            <User className="h-4 w-4" /> {quest.questGiver.name}
          </p>
        </div>

        <div className="px-5">
          <p className="mb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {quest.description}
          </p>

          <div className="mb-5 flex flex-wrap gap-2">
            {distance !== null && (
              <InfoChip icon={MapPin} text={formatDistance(distance)} />
            )}
            {diff && <InfoChip icon={Zap} text={`${diff.label} · ${diff.xp} XP`} />}
            {quest.reward != null && quest.reward > 0 && (
              <InfoChip icon={Coins} text={`${quest.reward}`} />
            )}
            {quest.timeLimit && (
              <InfoChip icon={Clock} text={formatTimeRemaining(quest.timeLimit)} />
            )}
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </div>
          )}

          {/* route planner */}
          <div className="mb-4 flex gap-2">
            <button
              onClick={planRoute}
              className="flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-indigo-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98]"
            >
              <Route className="h-4 w-4" /> Route generieren
            </button>
            <button
              onClick={openCompass}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 py-3.5 text-sm font-bold text-slate-700 transition-all active:scale-[0.98] dark:border-slate-600 dark:text-slate-200"
            >
              <Compass className="h-4 w-4" /> Kompass
            </button>
          </div>

          {/* actions */}
          <div className="mb-6 flex items-start justify-around gap-2 rounded-2xl bg-slate-50 py-4 dark:bg-slate-800/50">
            {isAcceptedByMe ? (
              <>
                <RoundActionButton
                  icon={CircleCheck}
                  label={loading ? '...' : 'Abschliessen'}
                  onClick={complete}
                  disabled={loading}
                  variant="success"
                />
                <RoundActionButton
                  icon={Flag}
                  label="Aufgeben"
                  onClick={abandon}
                  disabled={loading}
                  variant="danger"
                />
              </>
            ) : (
              <RoundActionButton
                icon={Swords}
                label={loading ? '...' : 'Annehmen'}
                onClick={accept}
                disabled={loading || !!quest.acceptedBy}
                variant="primary"
              />
            )}
            <RoundActionButton icon={Share2} label="Teilen" onClick={share} />
          </div>

          {/* logbook / comments */}
          <CommentSection questId={quest.id} />
        </div>
      </div>
    </div>
  );
}
