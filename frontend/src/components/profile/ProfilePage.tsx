import { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useUIStore } from '../../stores/useUIStore';
import { api } from '../../services/api';
import { logout } from '../../services/auth.service';
import DragonDisplay from '../dragon/DragonDisplay';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const darkMode = useUIStore((s) => s.darkMode);
  const toggleDarkMode = useUIStore((s) => s.toggleDarkMode);

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  const avatar =
    user.displayName?.[0]?.toUpperCase() || user.username[0].toUpperCase();

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/users/me', { displayName, bio });
      updateUser({ displayName, bio });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  };

  const handleToggleShareLocation = async () => {
    const newValue = !user.shareLocation;
    try {
      await api.patch('/users/me', { shareLocation: newValue });
      updateUser({ shareLocation: newValue });
    } catch {
      /* ignore */
    }
  };

  const handleLogout = async () => {
    await logout().catch(() => {});
    clearAuth();
  };

  const setActiveTab = useUIStore((s) => s.setActiveTab);

  return (
    <div className="flex h-full flex-col bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-5 pb-3 pt-5 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('map')}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Profil
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-16 pt-6">
        {/* Avatar */}
        <div className="mb-6 flex flex-col items-center">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="h-24 w-24 rounded-full object-cover ring-4 ring-indigo-500/20"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-indigo-500 text-3xl font-bold text-white ring-4 ring-indigo-500/20">
              {avatar}
            </div>
          )}
          <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">
            @{user.username}
          </p>
        </div>

        {/* Dragon */}
        <div className="mb-6">
          <DragonDisplay />
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
            {bio.length}/200
          </p>
        </div>

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

        {/* Location Sharing Toggle */}
        <div className="mb-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
          <div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Standort teilen
            </span>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Andere SideQuester sehen dich auf der Karte
            </p>
          </div>
          <button
            onClick={handleToggleShareLocation}
            className={`relative h-7 w-12 rounded-full transition-colors ${user.shareLocation ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${user.shareLocation ? 'translate-x-5' : ''}`}
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
    </div>
  );
}
