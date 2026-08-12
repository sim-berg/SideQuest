import { useEffect, useRef, useState } from 'react';
import type { Pet, PetChatMessage } from '../../types/pet';
import { fetchPetChat, sendPetChat } from '../../services/pet.service';
import { ELEMENT_META } from '../../constants/pets';
import PetAvatar from './PetAvatar';
import { cn } from '../../utils/cn';

/**
 * Full-screen chat with the active companion. The pet answers in character
 * (LLM persona from its soul.md; canned flavor lines without an API key).
 */
export default function PetChat({
  pet,
  onClose,
}: {
  pet: Pet;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<PetChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const element = pet.element ? ELEMENT_META[pet.element] : null;
  const petLabel = pet.species
    ? pet.name || `${element?.name}-${pet.speciesName}`
    : 'Mysteriöses Ei';

  useEffect(() => {
    fetchPetChat()
      .then(setMessages)
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setDraft('');
    setSending(true);
    const optimistic: PetChatMessage = {
      id: `tmp_${Date.now()}`,
      petId: pet.id,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    try {
      const { reply } = await sendPetChat(text);
      setMessages((m) => [...m, reply]);
    } catch {
      /* keep the user message; the pet just stays silent */
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-4 pb-3 pt-5 dark:border-slate-800">
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <PetAvatar pet={pet} size={36} />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
            {petLabel}
          </p>
          {element && (
            <p className="text-xs" style={{ color: element.color }}>
              {element.emoji} {element.name}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && !sending && (
          <p className="mt-10 text-center text-sm text-slate-400">
            {pet.species
              ? `Sag ${petLabel} hallo! 🐾`
              : 'Das Ei lauscht… vielleicht antwortet es ja.'}
          </p>
        )}
        <div className="flex flex-col gap-2">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                m.role === 'user'
                  ? 'self-end rounded-br-md bg-indigo-500 text-white'
                  : 'self-start rounded-bl-md bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
              )}
            >
              {m.content}
            </div>
          ))}
          {sending && (
            <div className="flex items-center gap-1 self-start rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 dark:bg-slate-800">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          )}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-slate-100 px-4 pb-6 pt-3 dark:border-slate-800">
        <div className="flex items-end gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            maxLength={500}
            placeholder={`Nachricht an ${petLabel}…`}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <button
            onClick={send}
            disabled={!draft.trim() || sending}
            className={cn(
              'rounded-xl px-4 py-3 text-sm font-bold text-white transition-all active:scale-95',
              draft.trim() && !sending
                ? 'bg-indigo-500 active:bg-indigo-600'
                : 'cursor-not-allowed bg-slate-300 dark:bg-slate-700',
            )}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
