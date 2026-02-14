interface QuestClusterMarkerProps {
  count: number;
  onClick: () => void;
}

export default function QuestClusterMarker({
  count,
  onClick,
}: QuestClusterMarkerProps) {
  const size = Math.min(24 + count * 2, 56);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex cursor-pointer items-center justify-center rounded-full border-2 border-gold bg-wood font-bold text-parchment-light shadow-lg transition-transform hover:scale-110 active:scale-95"
      style={{ width: size, height: size }}
      aria-label={`${count} Quests`}
    >
      {count}
    </button>
  );
}
