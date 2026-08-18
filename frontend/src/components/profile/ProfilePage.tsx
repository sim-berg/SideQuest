import { useEffect, useMemo, useState } from 'react';
import { MapPin, User } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useUIStore } from '../../stores/useUIStore';
import { logout } from '../../services/auth.service';
import { fetchMySoul, updateMyProfile } from '../../services/user.service';
import { fetchMyAchievements } from '../../services/achievement.service';
import type { ProfileLink, UserSoul } from '../../types/user';
import type { Emblem } from '../../types/achievement';
import { CHARACTER_CLASSES } from '../../constants/characterClasses';
import { ELEMENT_META } from '../../constants/pets';
import { scopeCss, isCssSafe } from '../../utils/profileCss';
import OverlayPage from '../common/OverlayPage';
import { ContributionCalendar } from './ContributionCalendar';
import EmblemShelf from './EmblemShelf';
import FeaturedEmblemPicker from './FeaturedEmblemPicker';
import ProfileLinksEditor from './ProfileLinksEditor';
import ProfileWall from './ProfileWall';
import PublicProfileSheet from './PublicProfileSheet';

type Tab = 'profil' | 'embleme' | 'pinnwand';

const INPUT =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white';
const LABEL =
  'mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const darkMode = useUIStore((s) => s.darkMode);
  const toggleDarkMode = useUIStore((s) => s.toggleDarkMode);
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const setShowAuthPrompt = useUIStore((s) => s.setShowAuthPrompt);

  const [tab, setTab] = useState<Tab>('profil');

  // Editable profile fields
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [status, setStatus] = useState(user?.status || '');
  const [openForQuests, setOpenForQuests] = useState(
    user?.openForQuests ?? true,
  );
  const [characterClass, setCharacterClass] = useState(
    user?.characterClass || '',
  );
  const [homeRegion, setHomeRegion] = useState(user?.homeRegion || '');
  const [accentColor, setAccentColor] = useState(user?.accentColor || '#6366f1');
  const [links, setLinks] = useState<ProfileLink[]>(user?.links ?? []);
  const [featured, setFeatured] = useState<string[]>(
    user?.featuredEmblems ?? [],
  );
  const [profileCss, setProfileCss] = useState(user?.profileCss || '');
  const [pseudonym, setPseudonym] = useState(user?.pseudonym || '');

  const [soul, setSoul] = useState<UserSoul | null>(null);
  const [soulOpen, setSoulOpen] = useState(false);
  const [emblems, setEmblems] = useState<Emblem[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    fetchMySoul().then(setSoul).catch(() => {});
    fetchMyAchievements().then(setEmblems).catch(() => {});
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

  const featuredEmblems = useMemo(
    () =>
      featured
        .map((k) => emblems.find((e) => e.key === k))
        .filter((e): e is Emblem => !!e),
    [featured, emblems],
  );

  if (!user) return null;

  const avatar =
    user.displayName?.[0]?.toUpperCase() || user.username[0].toUpperCase();
  const activeClass = CHARACTER_CLASSES.find((c) => c.id === characterClass);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    const patch = {
      displayName,
      bio,
      status,
      openForQuests,
      characterClass,
      homeRegion,
      accentColor,
      // Drop half-filled rows rather than rejecting the whole save.
      links: links.filter((l) => l.label.trim() && /^https?:\/\//i.test(l.url)),
      featuredEmblems: featured,
      profileCss,
      pseudonym,
    };
    try {
      await updateMyProfile(patch);
      updateUser(patch);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen');
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
        {/* Profile card — the user's CSS playground, live-previewed */}
        {scopedCss && <style>{scopedCss}</style>}
        <div className="profile-canvas mb-4 flex flex-col items-center rounded-2xl p-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="avatar h-24 w-24 rounded-full object-cover ring-4 ring-indigo-500/20"
            />
          ) : (
            <div
              className="avatar flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold text-white"
              style={{ backgroundColor: accentColor || '#6366f1' }}
            >
              {avatar}
            </div>
          )}
          <h2 className="name mt-3 text-lg font-bold text-slate-900 dark:text-white">
            {displayName || user.username}
          </h2>
          <p className="username text-sm text-slate-400 dark:text-slate-500">
            @{user.username}
          </p>

          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            {activeClass && (
              <span
                className="rounded-full px-2.5 py-1 text-xs font-bold text-white"
                style={{ backgroundColor: activeClass.color }}
              >
                {activeClass.emoji} {activeClass.name}
              </span>
            )}
            {openForQuests && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                ✅ Open for Quests
              </span>
            )}
            {homeRegion && (
              <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <MapPin className="h-3 w-3" />
                {homeRegion}
              </span>
            )}
          </div>

          {status && (
            <p className="status mt-2 text-center text-sm font-medium italic text-slate-500 dark:text-slate-400">
              „{status}"
            </p>
          )}
          {bio && (
            <p className="bio mt-2 text-center text-sm whitespace-pre-wrap text-slate-600 dark:text-slate-300">
              {bio}
            </p>
          )}

          {featuredEmblems.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {featuredEmblems.map((e) => (
                <img
                  key={e.key}
                  src={e.imageUrl ?? undefined}
                  alt={e.title}
                  title={e.title}
                  className="h-9 w-9 rounded-full object-contain"
                  style={{ boxShadow: `0 2px 8px ${e.color}44` }}
                />
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setPreviewOpen(true)}
          className="mb-5 w-full rounded-xl border-2 border-slate-200 py-2 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          So sehen dich andere
        </button>

        {/* Tabs */}
        <div className="mb-5 flex gap-2">
          {(['profil', 'embleme', 'pinnwand'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={
                tab === t
                  ? 'flex-1 rounded-xl bg-slate-900 py-2 text-xs font-bold text-white capitalize dark:bg-white dark:text-slate-900'
                  : 'flex-1 rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-500 capitalize dark:bg-slate-800 dark:text-slate-400'
              }
            >
              {t === 'embleme' ? `Embleme (${emblems.length})` : t}
            </button>
          ))}
        </div>

        {tab === 'embleme' && (
          <>
            <div className="mb-6">
              <p className={LABEL}>
                Anheften{' '}
                <span className="font-normal text-slate-400">
                  — diese Embleme stehen oben auf deinem Profil
                </span>
              </p>
              <FeaturedEmblemPicker
                emblems={emblems}
                selected={featured}
                onChange={setFeatured}
              />
            </div>
            <EmblemShelf
              emblems={emblems}
              featured={featuredEmblems}
              ownerName={displayName || user.username}
            />
            <SaveBar
              onSave={handleSave}
              saving={saving}
              saved={saved}
              error={saveError}
            />
          </>
        )}

        {tab === 'pinnwand' && (
          <ProfileWall userId={user.id} onOpenProfile={() => undefined} />
        )}

        {tab === 'profil' && (
          <>
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
                      <pre className="mt-2 max-h-48 overflow-y-auto rounded-xl bg-slate-100 p-3 font-sans text-xs leading-relaxed whitespace-pre-wrap text-slate-600 dark:bg-slate-800 dark:text-slate-300">
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
              <label className={LABEL}>Anzeigename</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={48}
                className={INPUT}
              />
            </div>

            {/* Status */}
            <div className="mb-4">
              <label className={LABEL}>
                Status{' '}
                <span className="font-normal text-slate-400">
                  — woran du gerade bist
                </span>
              </label>
              <input
                type="text"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                maxLength={80}
                placeholder="z.B. Suche Laufpartner für Sonntag"
                className={INPUT}
              />
            </div>

            {/* Open for quests */}
            <div className="mb-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Open for Quests
                </p>
                <p className="text-xs text-slate-400">
                  Zeigt anderen, dass du gerade Lust auf Quests hast
                </p>
              </div>
              <button
                onClick={() => setOpenForQuests(!openForQuests)}
                role="switch"
                aria-checked={openForQuests}
                aria-label="Open for Quests"
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                  openForQuests ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                    openForQuests ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>

            {/* Character class */}
            <div className="mb-4">
              <label className={LABEL}>
                Charakter{' '}
                <span className="font-normal text-slate-400">
                  — wie du dich siehst
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                {CHARACTER_CLASSES.map((c) => {
                  const active = characterClass === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setCharacterClass(active ? '' : c.id)}
                      title={c.blurb}
                      className="rounded-full px-3 py-1.5 text-xs font-bold transition-all active:scale-95"
                      style={
                        active
                          ? { backgroundColor: c.color, color: '#fff' }
                          : {
                              backgroundColor: `${c.color}1a`,
                              color: c.color,
                            }
                      }
                    >
                      {c.emoji} {c.name}
                    </button>
                  );
                })}
              </div>
              {activeClass && (
                <p className="mt-2 text-xs text-slate-400">
                  {activeClass.blurb}
                </p>
              )}
            </div>

            {/* Region + accent color */}
            <div className="mb-4 flex gap-3">
              <div className="min-w-0 flex-1">
                <label className={LABEL}>Gegend</label>
                <input
                  type="text"
                  value={homeRegion}
                  onChange={(e) => setHomeRegion(e.target.value)}
                  maxLength={60}
                  placeholder="z.B. Berlin Neukölln"
                  className={INPUT}
                />
              </div>
              <div className="w-24 shrink-0">
                <label className={LABEL}>Farbe</label>
                <input
                  type="color"
                  value={accentColor || '#6366f1'}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-[46px] w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

            {/* Bio */}
            <div className="mb-4">
              <label className={LABEL}>Über dich</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={500}
                rows={3}
                className={`${INPUT} resize-none`}
              />
              <p className="mt-1 text-right text-xs text-slate-400">
                {bio.length}/500
              </p>
            </div>

            {/* Links */}
            <div className="mb-4">
              <label className={LABEL}>
                Links{' '}
                <span className="font-normal text-slate-400">
                  — was andere von dir sehen dürfen
                </span>
              </label>
              <ProfileLinksEditor links={links} onChange={setLinks} />
            </div>

            {/* Pseudonym */}
            <div className="mb-4">
              <label className={LABEL}>
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
                className={INPUT}
              />
            </div>

            {/* Profil-CSS */}
            <div className="mb-6">
              <label className={LABEL}>
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
                className={`${INPUT} resize-y font-mono text-xs`}
              />
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Klassen: <code>.avatar</code> <code>.name</code>{' '}
                  <code>.username</code> <code>.bio</code> <code>.status</code>{' '}
                  · kein url()/@import
                </span>
                <span
                  className={
                    cssSafe ? 'text-slate-400' : 'font-bold text-red-500'
                  }
                >
                  {cssSafe ? `${profileCss.length}/2000` : 'Nicht erlaubtes CSS'}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="mb-6 flex gap-4">
              <div className="flex-1 rounded-xl bg-slate-50 p-4 text-center dark:bg-slate-800/50">
                <p className="text-2xl font-bold text-indigo-500">
                  {user.level}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Level
                </p>
              </div>
              <div className="flex-1 rounded-xl bg-slate-50 p-4 text-center dark:bg-slate-800/50">
                <p className="text-2xl font-bold text-indigo-500">
                  {user.questsCompleted}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Quests
                </p>
              </div>
              <div className="flex-1 rounded-xl bg-slate-50 p-4 text-center dark:bg-slate-800/50">
                <p className="text-2xl font-bold text-indigo-500">
                  {emblems.length}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Embleme
                </p>
              </div>
            </div>

            <SaveBar
              onSave={handleSave}
              saving={saving}
              saved={saved}
              error={saveError}
            />

            {/* Dark Mode Toggle */}
            <div className="mb-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Dark Mode
              </span>
              <button
                onClick={toggleDarkMode}
                aria-label="Dark Mode"
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
          </>
        )}
      </div>

      {previewOpen && (
        <PublicProfileSheet
          userId={user.id}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </OverlayPage>
  );
}

function SaveBar({
  onSave,
  saving,
  saved,
  error,
}: {
  onSave: () => void;
  saving: boolean;
  saved: boolean;
  error: string | null;
}) {
  return (
    <>
      {error && (
        <div className="mt-4 mb-2 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}
      <button
        onClick={onSave}
        disabled={saving}
        className="my-4 w-full rounded-xl bg-indigo-500 py-3 text-sm font-bold text-white transition-all hover:bg-indigo-600 active:scale-[0.98] disabled:opacity-50"
      >
        {saved ? 'Gespeichert!' : saving ? 'Speichern...' : 'Speichern'}
      </button>
    </>
  );
}
