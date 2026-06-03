import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Send, X, MessageSquare, Loader2 } from 'lucide-react';
import { useCommentStore } from '../../stores/useCommentStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useUIStore } from '../../stores/useUIStore';
import { postComment } from '../../services/comment.service';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'gerade eben';
  if (m < 60) return `vor ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h} h`;
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'short',
  });
}

export default function CommentSection({ questId }: { questId: string }) {
  const comments = useCommentStore((s) => s.byQuest[questId]);
  const loading = useCommentStore((s) => s.loading);
  const fetchFor = useCommentStore((s) => s.fetchFor);
  const addComment = useCommentStore((s) => s.addComment);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setShowAuthPrompt = useUIStore((s) => s.setShowAuthPrompt);

  const [body, setBody] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void fetchFor(questId);
  }, [questId, fetchFor]);

  const pickImage = (file: File | null) => {
    setImage(file);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const handlePost = async () => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }
    if (!body.trim() && !image) return;
    setPosting(true);
    setError(null);
    try {
      const created = await postComment(questId, body.trim(), image);
      addComment(questId, created);
      setBody('');
      pickImage(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (e: any) {
      setError(e?.message || 'Kommentar konnte nicht gepostet werden');
    } finally {
      setPosting(false);
    }
  };

  const list = comments ?? [];

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-amber-500" />
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Logbuch ({list.length})
        </h3>
      </div>

      {/* composer */}
      <div className="mb-5 rounded-2xl border border-slate-100 p-3 dark:border-slate-800">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Teile deine Erfahrung zu dieser SideQuest…"
          rows={2}
          className="w-full resize-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
        />

        {preview && (
          <div className="relative mt-2 inline-block">
            <img
              src={preview}
              alt="Vorschau"
              className="max-h-40 rounded-lg object-cover"
            />
            <button
              onClick={() => {
                pickImage(null);
                if (fileRef.current) fileRef.current.value = '';
              }}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white shadow"
              aria-label="Bild entfernen"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {error && (
          <p className="mt-2 text-xs text-red-500">{error}</p>
        )}

        <div className="mt-2 flex items-center justify-between">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pickImage(e.target.files?.[0] ?? null)}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ImagePlus className="h-5 w-5" /> Bild
          </button>
          <button
            onClick={handlePost}
            disabled={posting || (!body.trim() && !image)}
            className="flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-2 text-sm font-bold text-white shadow active:scale-95 disabled:opacity-50"
          >
            {posting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Posten
          </button>
        </div>
      </div>

      {/* thread */}
      {loading && list.length === 0 ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
        </div>
      ) : list.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-400">
          Noch keine Einträge. Sei der Erste!
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {list.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-sm font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                {c.avatarUrl ? (
                  <img
                    src={c.avatarUrl}
                    alt={c.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (c.username || '?').charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {c.username || 'Abenteurer'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {timeAgo(c.createdAt)}
                  </span>
                </div>
                {c.body && (
                  <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                    {c.body}
                  </p>
                )}
                {c.imageUrl && (
                  <img
                    src={c.imageUrl}
                    alt="Anhang"
                    className="mt-2 max-h-60 rounded-xl object-cover"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
