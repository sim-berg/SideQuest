import { cn } from '../../utils/cn';

interface ChatBubbleProps {
  body: string;
  time: string;
  isOwn: boolean;
  read?: boolean;
}

export default function ChatBubble({ body, time, isOwn, read }: ChatBubbleProps) {
  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2',
          isOwn
            ? 'rounded-br-md bg-indigo-500 text-white'
            : 'rounded-bl-md bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white',
        )}
      >
        <p className="whitespace-pre-wrap break-words text-sm">{body}</p>
        <div
          className={cn(
            'mt-1 flex items-center gap-1 text-[10px]',
            isOwn ? 'justify-end text-indigo-200' : 'text-slate-400',
          )}
        >
          <span>{time}</span>
          {isOwn && <span>{read ? '✓✓' : '✓'}</span>}
        </div>
      </div>
    </div>
  );
}
