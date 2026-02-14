import { useState } from 'react';
import PixelIcon from '../common/PixelIcon';
import { useUIStore } from '../../stores/useUIStore';

export default function Navbar() {
  const [messagesRead, setMessagesRead] = useState(false);
  const darkMode = useUIStore((s) => s.darkMode);

  const handleMessages = () => {
    setMessagesRead((prev) => !prev);
  };

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-30 border-t-2 border-gold pb-[env(safe-area-inset-bottom)]">
      <div className={darkMode ? 'bg-wood-plank-dark' : 'bg-wood-plank'}>
        <div className="flex items-center justify-around px-2 py-2">
          <NavButton
            onClick={() => alert('Quest-Log kommt bald!')}
            label="Quest Log"
          >
            <PixelIcon id={20} size={28} alt="Quest Log" />
          </NavButton>

          <NavButton onClick={handleMessages} label="Nachrichten">
            <PixelIcon id={messagesRead ? 19 : 18} size={28} alt="Nachrichten" />
          </NavButton>

          <NavButton
            onClick={() => alert('Inventar kommt bald!')}
            label="Inventar"
          >
            <PixelIcon id={32} size={28} alt="Inventar" />
          </NavButton>
        </div>
      </div>
    </nav>
  );
}

function NavButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex h-12 w-12 items-center justify-center rounded-lg transition-transform active:scale-90"
      aria-label={label}
    >
      {children}
    </button>
  );
}
