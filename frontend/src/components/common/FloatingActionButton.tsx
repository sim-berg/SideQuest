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
      className="fixed right-4 bottom-20 z-20 flex h-14 w-14 items-center justify-center rounded-full border-2 border-gold bg-wood shadow-xl transition-all hover:bg-wood-dark active:scale-95"
      aria-label="Neue Quest erstellen"
    >
      <PixelIcon id={20} size={28} alt="Quest erstellen" />
    </button>
  );
}
