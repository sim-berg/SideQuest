import { Popup } from 'react-map-gl/maplibre';
import {
  Navigation,
  Swords,
  CircleCheck,
  Info,
  Sparkles,
  MapPin,
  Zap,
} from 'lucide-react';
import { useSideQuestStore } from '../../stores/useSideQuestStore';
import { useSideQuestActions } from '../../hooks/useSideQuestActions';
import { useQuestDistance } from '../../hooks/useQuestDistance';
import { CATEGORY_META } from '../../constants/categories';
import { DIFFICULTY_META } from '../../constants/difficulty';
import { formatDistance } from '../../utils/format';
import RoundActionButton from './RoundActionButton';

/**
 * Google-Maps-style card anchored directly above the selected side quest
 * marker. Shows a quick summary + quick actions and a "Details" button that
 * expands to the full-screen detail. Rendered inside <Map> so it tracks the
 * marker as the map pans/zooms. Closing deselects the quest.
 */
export default function SideQuestPeekCard() {
  const quest = useSideQuestStore((s) => s.selected);
  const detailOpen = useSideQuestStore((s) => s.detailOpen);
  const setSelected = useSideQuestStore((s) => s.setSelected);
  const openDetail = useSideQuestStore((s) => s.openDetail);

  const { loading, isAcceptedByMe, accept, complete, navigate } =
    useSideQuestActions(quest);
  const distance = useQuestDistance(quest?.lat ?? 0, quest?.lng ?? 0);

  // Only show the floating card when a side quest is selected and the full
  // detail screen isn't open.
  if (!quest || detailOpen) return null;

  const meta = CATEGORY_META[quest.category];
  const diff = DIFFICULTY_META[quest.difficulty ?? 'medium'];

  return (
    <Popup
      longitude={quest.lng}
      latitude={quest.lat}
      anchor="bottom"
      offset={28}
      closeButton={false}
      closeOnClick={true}
      onClose={() => setSelected(null)}
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
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
              <Sparkles className="h-3 w-3" /> SideQuest
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
            icon={Navigation}
            label="Route"
            onClick={navigate}
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
