import { Popup } from 'react-map-gl/maplibre';
import { useLocation } from 'wouter';
import {
  Share2,
  Swords,
  CircleCheck,
  Info,
  MapPin,
  Zap,
} from 'lucide-react';
import { useQuestStore } from '../../stores/useQuestStore';
import { useQuestActions } from '../../hooks/useQuestActions';
import { useQuestDistance } from '../../hooks/useQuestDistance';
import { CATEGORY_META } from '../../constants/categories';
import { DIFFICULTY_META } from '../../constants/difficulty';
import { formatDistance } from '../../utils/format';
import { toSlug } from '../../utils/slug';
import RoundActionButton from '../sidequest/RoundActionButton';

/**
 * Google-Maps-style card anchored directly above the selected quest marker.
 * Quick summary + actions, and a "Details" button that opens the full detail
 * screen (/quest/:slug). Rendered inside <Map> so it tracks the marker.
 */
export default function QuestPeekCard() {
  const quest = useQuestStore((s) => s.selectedQuest);
  const selectQuest = useQuestStore((s) => s.selectQuest);
  const [, setLocation] = useLocation();

  const { loading, isAcceptedByMe, accept, complete, share } =
    useQuestActions(quest);
  const distance = useQuestDistance(quest?.lat ?? 0, quest?.lng ?? 0);

  if (!quest) return null;

  const meta = CATEGORY_META[quest.category];
  const diff = DIFFICULTY_META[quest.difficulty ?? 'medium'];

  const openDetail = () => {
    setLocation(`/quest/${toSlug(quest.title, quest.id)}`);
    selectQuest(null);
  };

  return (
    <Popup
      longitude={quest.lng}
      latitude={quest.lat}
      anchor="bottom"
      offset={28}
      closeButton={false}
      closeOnClick={true}
      onClose={() => selectQuest(null)}
      maxWidth="288px"
      className="sidequest-popup"
    >
      <div className="w-64 rounded-2xl bg-white p-3 shadow-2xl dark:bg-slate-900">
        {/* tappable summary opens the full detail */}
        <button
          onClick={openDetail}
          className="mb-3 flex w-full items-start gap-2 text-left"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg"
            style={{ backgroundColor: `${meta.color}22` }}
          >
            {meta.icon}
          </span>
          <div className="min-w-0 flex-1">
            <span
              className="text-[10px] font-bold uppercase tracking-wide"
              style={{ color: meta.color }}
            >
              {meta.label}
            </span>
            <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">
              {quest.title}
            </h3>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {distance !== null && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <MapPin className="h-3 w-3" /> {formatDistance(distance)}
                </span>
              )}
              {diff && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <Zap className="h-3 w-3" /> {diff.xp} XP
                </span>
              )}
            </div>
          </div>
        </button>

        <div className="flex items-start justify-around gap-1">
          <RoundActionButton
            icon={Share2}
            label="Teilen"
            onClick={share}
            size="sm"
          />
          {isAcceptedByMe ? (
            <RoundActionButton
              icon={CircleCheck}
              label={loading ? '...' : 'Fertig'}
              onClick={complete}
              disabled={loading}
              variant="success"
              size="sm"
            />
          ) : (
            <RoundActionButton
              icon={Swords}
              label={loading ? '...' : 'Annehmen'}
              onClick={accept}
              disabled={loading || !!quest.acceptedBy}
              variant="primary"
              size="sm"
            />
          )}
          <RoundActionButton
            icon={Info}
            label="Details"
            onClick={openDetail}
            size="sm"
          />
        </div>
      </div>
    </Popup>
  );
}
