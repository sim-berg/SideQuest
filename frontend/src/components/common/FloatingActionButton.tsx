import PixelIcon from './PixelIcon';

interface FloatingActionButtonProps {
  onClick: () => void;
}

export default function FloatingActionButton({
  onClick,
}: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="neon-glow-magenta fixed right-4 bottom-20 z-20 flex h-14 w-14 items-center justify-center rounded-full border border-neon-magenta bg-neon-magenta/15 shadow-xl transition-all hover:bg-neon-magenta/25 active:scale-95"
      aria-label="Neue Quest erstellen"
    >
      <PixelIcon id={20} size={28} alt="Quest erstellen" />
    </button>
  );
}
