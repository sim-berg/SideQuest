import { useState } from 'react';
import { register } from '../../services/auth.service';
import { useAuthStore } from '../../stores/useAuthStore';

interface RegisterPageProps {
  onSwitchToLogin: () => void;
  onSuccess?: () => void;
}

export default function RegisterPage({ onSwitchToLogin, onSuccess }: RegisterPageProps) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  const usernameError =
    username && (username.length < 3 || username.length > 24)
      ? 'Benutzername muss 3-24 Zeichen lang sein'
      : '';

  const passwordError =
    password && password.length < 8
      ? 'Passwort muss mindestens 8 Zeichen lang sein'
      : '';

  const confirmError =
    confirmPassword && confirmPassword !== password
      ? 'Passwoerter stimmen nicht ueberein'
      : '';

  const isValid =
    email &&
    username.length >= 3 &&
    password.length >= 8 &&
    password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setError('');
    setLoading(true);
    try {
      const res = await register(email, username, password);
      setAuth(res.user, res.accessToken);
      onSuccess?.();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Registrierung fehlgeschlagen',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 dark:bg-slate-900">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-center text-3xl font-bold text-indigo-500">
          SideQuest
        </h1>
        <p className="mb-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Erstelle dein Konto
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />

          <div>
            <input
              type="text"
              placeholder="Benutzername"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            {usernameError && (
              <p className="mt-1 text-xs text-red-500">{usernameError}</p>
            )}
          </div>

          <div>
            <input
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            {passwordError && (
              <p className="mt-1 text-xs text-red-500">{passwordError}</p>
            )}
          </div>

          <div>
            <input
              type="password"
              placeholder="Passwort bestaetigen"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            {confirmError && (
              <p className="mt-1 text-xs text-red-500">{confirmError}</p>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading || !isValid}
            className="rounded-xl bg-indigo-500 py-3 text-sm font-bold text-white transition-all hover:bg-indigo-600 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Registrieren...' : 'Registrieren'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Bereits ein Konto?{' '}
          <button
            onClick={onSwitchToLogin}
            className="font-semibold text-indigo-500 hover:text-indigo-600"
          >
            Anmelden
          </button>
        </p>
      </div>
    </div>
  );
}
