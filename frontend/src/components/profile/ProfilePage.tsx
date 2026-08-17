import { useEffect, useMemo, useState } from 'react';
import { User } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useUIStore } from '../../stores/useUIStore';
import { api } from '../../services/api';
import { logout } from '../../services/auth.service';
import { fetchMySoul } from '../../services/user.service';
import type { UserSoul } from '../../types/user';
import { ELEMENT_META } from '../../constants/pets';
import { scopeCss, isCssSafe } from '../../utils/profileCss';
import OverlayPage from '../common/OverlayPage';
import { ContributionCalendar } from './ContributionCalendar';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const darkMode = useUIStore((s) => s.darkMode);
  const toggleDarkMode = useUIStore((s) => s.toggleDarkMode);
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const setShowAuthPrompt = useUIStore((s) => s.setShowAuthPrompt);

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profileCss, setProfileCss] = useState(user?.profileCss || '');
  const [pseudonym, setPseudonym] = useState(user?.pseudonym || '');
  const [soul, setSoul] = useState<UserSoul | null>(null);
  const [soulOpen, setSoulOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    fetchMySoul().then(setSoul).catch(() => {});
  }, [userId]);

  // The profile needs a session — send visitors to the login screen
  // instead of rendering an empty page.
  useEffect(() => {
    if (user) return;
    setActiveTab('map');
    setShowAuthPrompt(true, 'profile');
  }, [user, setActiveTab, setShowAuthPrompt]);

  // Live preview: user CSS scoped to the profile card.
  const scopedCss = useMemo(
    () => scopeCss(profileCss, '.profile-canvas'),
    [profileCss],
  );
  const cssSafe = isCssSafe(profileCss);

  if (!user) return null;

  const avatar =
    user.displayName?.[0]?.toUpperCase() || user.username[0].toUpperCase();

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await api.patch('/users/me', { displayName, bio, profileCss, pseudonym });
      updateUser({ displayName, bio, profileCss, pseudonym });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setSaveError(e?.message || 'Speichern fehlgeschlagen');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    // Leave the profile first so signing out lands on the map, not on the
    // login screen the auth guard would otherwise open.
    setActiveTab('map');
    await logout().catch(() => {});
    clearAuth();
  };

  return (
    <OverlayPage
      title="Profil"
      icon={<User className="h-6 w-6 text-indigo-500" strokeWidth={2.2} />}
      onClose={() => setActiveTab('map')}
    >
      <div>
        {/* Profile card — the user's CSS playground */}
        {scopedCss && <style>{scopedCss}</style>}
        <div className="profile-canvas mb-6 flex flex-col items-center rounded-2xl p-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="h-24 w-24 rounded-full object-cover ring-4 ring-indigo-500/20"
            />
          ) : (
            <div className="avatar flex h-24 w-24 items-center justify-center rounded-full bg-indigo-500 text-3xl font-bold text-white ring-4 ring-indigo-500/20">
              {avatar}
            </div>
          )}
          <h2 className="name mt-3 text-lg font-bold text-slate-900 dark:text-white">
            {displayName || user.username}
          </h2>
          <p className="username text-sm text-slate-400 dark:text-slate-500">
            @{user.username}
          </p>
          {bio && (
            <p className="bio mt-2 whitespace-pre-wrap text-center text-sm text-slate-600 dark:text-slate-300">
              {bio}
            </p>
          )}
        </div>

        {/* Seele — element affinity grown from completed quests */}
        {soul && Object.keys(soul.elementScores).length > 0 && (
          <div className="mb-6 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                ✨ Deine Seele
              </p>
              {soul.dominantElement && (
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-bold text-white"
                  style={{ backgroundColor: soul.dominantElement.color }}
                >
                  {soul.dominantElement.emoji} {soul.dominantElement.name}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              {Object.entries(soul.elementScores)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([el, score]) => {
                  const meta = ELEMENT_META[el as keyof typeof ELEMENT_META];
                  const max = Math.max(...Object.values(soul.elementScores));
                  return (
                    <div key={el} className="flex items-center gap-2">
                      <span className="w-5 text-center text-xs">
                        {meta?.emoji ?? '✨'}
                      </span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(score / max) * 100}%`,
                            backgroundColor: meta?.color ?? '#94a3b8',
                          }}
                        />
                      </div>
                      <span className="w-10 text-right text-[10px] text-slate-400">
                        {meta?.name ?? el}
                      </span>
                    </div>
                  );
                })}
            </div>
            {soul.content && (
              <div className="mt-3">
                <button
                  onClick={() => setSoulOpen(!soulOpen)}
                  className="text-xs font-semibold text-slate-500 underline-offset-2 hover:underline dark:text-slate-400"
                >
                  {soulOpen ? 'soul.md verbergen' : '📜 soul.md ansehen'}
                </button>
                {soulOpen && (
                  <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-100 p-3 font-sans text-xs leading-relaxed text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {soul.content}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}

        {/* Contributions Calendar */}
        <div className="mb-6">
          <ContributionCalendar />
        </div>

        {/* Display Name */}
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
            Anzeigename
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={48}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {/* Pseudonym */}
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
            Pseudonym{' '}
            <span className="font-normal text-slate-400">
              — für Quests, die du anonym veröffentlichen willst
            </span>
          </label>
          <input
            type="text"
            value={pseudonym}
            onChange={(e) => setPseudonym(e.target.value)}
            maxLength={24}
            placeholder="z.B. Schattenwanderer"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {/* Bio */}
        <div className="mb-6">
          <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={200}
            rows={3}
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <p className="mt-1 text-right text-xs text-slate-400">
            {bio.length}/500
          </p>
        </div>

        {/* Profil-CSS */}
        <div className="mb-6">
          <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
            Profil-CSS{' '}
            <span className="font-normal text-slate-400">
              — gestalte deine Karte frei (MySpace lebt!)
            </span>
          </label>
          <textarea
            value={profileCss}
            onChange={(e) => setProfileCss(e.target.value)}
            maxLength={2000}
            rows={5}
            spellCheck={false}
            placeholder={
              'background: linear-gradient(135deg, #f0abfc, #818cf8);\n.bio { font-style: italic; }\n.name { color: #fff; text-shadow: 0 2px 8px #0008; }'
            }
            className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-xs text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Klassen: <code>.avatar</code> <code>.name</code>{' '}
              <code>.username</code> <code>.bio</code> · kein url()/@import
            </span>
            <span className={cssSafe ? 'text-slate-400' : 'font-bold text-red-500'}>
              {cssSafe ? `${profileCss.length}/2000` : 'Nicht erlaubtes CSS'}
            </span>
          </div>
        </div>

        {saveError && (
          <div className="mb-4 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {saveError}
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1 rounded-xl bg-slate-50 p-4 text-center dark:bg-slate-800/50">
            <p className="text-2xl font-bold text-indigo-500">{user.level}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Level</p>
          </div>
          <div className="flex-1 rounded-xl bg-slate-50 p-4 text-center dark:bg-slate-800/50">
            <p className="text-2xl font-bold text-indigo-500">
              {user.questsCompleted}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quests
            </p>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="mb-4 w-full rounded-xl bg-indigo-500 py-3 text-sm font-bold text-white transition-all hover:bg-indigo-600 active:scale-[0.98] disabled:opacity-50"
        >
          {saved ? 'Gespeichert!' : saving ? 'Speichern...' : 'Speichern'}
        </button>

        {/* Dark Mode Toggle */}
        <div className="mb-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Dark Mode
          </span>
          <button
            onClick={toggleDarkMode}
            className="relative h-7 w-12 rounded-full bg-slate-300 transition-colors dark:bg-indigo-500"
          >
            <span
              className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${darkMode ? 'translate-x-5' : ''}`}
            />
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full rounded-xl border-2 border-red-200 py-3 text-sm font-bold text-red-500 transition-all hover:bg-red-50 active:scale-[0.98] dark:border-red-900 dark:hover:bg-red-950/30"
        >
          Abmelden
        </button>
      </div>
    </OverlayPage>
  );
}
