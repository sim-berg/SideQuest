import { useState } from 'react';
import { useUIStore } from '../../stores/useUIStore';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';

export default function AuthPrompt() {
  const showAuthPrompt = useUIStore((s) => s.showAuthPrompt);
  const pendingAuthTab = useUIStore((s) => s.pendingAuthTab);
  const setShowAuthPrompt = useUIStore((s) => s.setShowAuthPrompt);
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const [showRegister, setShowRegister] = useState(false);

  if (!showAuthPrompt) return null;

  const handleSuccess = () => {
    setShowAuthPrompt(false);
    if (pendingAuthTab) {
      setActiveTab(pendingAuthTab);
    }
  };

  const handleClose = () => {
    setShowAuthPrompt(false);
    setActiveTab('map');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      {/* Centered modal container */}
      <div className="relative w-full max-w-5xl rounded-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-200/80 text-slate-600 backdrop-blur-sm dark:bg-slate-700/80 dark:text-slate-300"
          aria-label="Schliessen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        {showRegister ? (
          <RegisterPage
            onSwitchToLogin={() => setShowRegister(false)}
            onSuccess={handleSuccess}
          />
        ) : (
          <LoginPage
            onSwitchToRegister={() => setShowRegister(true)}
            onSuccess={handleSuccess}
          />
        )}
      </div>
    </div>
  );
}
