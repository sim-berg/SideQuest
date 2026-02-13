interface FloatingActionButtonProps {
  onClick: () => void;
}

export default function FloatingActionButton({
  onClick,
}: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed right-4 bottom-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500 text-2xl text-white shadow-xl transition-all hover:bg-indigo-600 active:scale-95"
      aria-label="Neue Quest erstellen"
    >
      +
    </button>
  );
}
