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
    <nav className="neon-strip fixed right-0 bottom-0 left-0 z-30 pb-[env(safe-area-inset-bottom)]">
      <div className="border-t border-neon-cyan/30 bg-cyber-light-panel/90 backdrop-blur-xl dark:border-neon-cyan/20 dark:bg-cyber-surface/90">
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
      className="flex h-12 w-12 items-center justify-center rounded-lg transition-all hover:bg-neon-cyan/10 active:scale-90 dark:hover:bg-neon-cyan/10"
      aria-label={label}
    >
      {children}
    </button>
  );
}
