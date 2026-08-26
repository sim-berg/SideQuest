import { useState } from 'react';
import { login } from '../../services/auth.service';
import { useAuthStore } from '../../stores/useAuthStore';

interface LoginPageProps {
  onSwitchToRegister: () => void;
  onSuccess?: () => void;
}

export default function LoginPage({ onSwitchToRegister, onSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      setAuth(res.user, res.accessToken);
      onSuccess?.();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-white px-6 py-12 dark:bg-slate-900">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-center text-3xl font-bold text-indigo-500">
          SideQuest
        </h1>
        <p className="mb-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Melde dich an, um loszulegen
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
          <input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-indigo-500 py-3 text-sm font-bold text-white transition-all hover:bg-indigo-600 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Anmelden...' : 'Anmelden'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Noch kein Konto?{' '}
          <button
            onClick={onSwitchToRegister}
            className="font-semibold text-indigo-500 hover:text-indigo-600"
          >
            Registrieren
          </button>
        </p>
      </div>
    </div>
  );
}
