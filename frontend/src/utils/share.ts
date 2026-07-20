import type { Quest } from '../types/quest';
import { toSlug } from './slug';

/** Canonical deep link to a quest's detail page. */
export function questUrl(quest: Quest): string {
  return `${window.location.origin}/quest/${toSlug(quest.title, quest.id)}`;
}

/**
 * Share a quest as a link. Mobile gets the native share sheet; everywhere else
 * we copy the URL and report back so the caller can toast.
 *
 * Always shares the deep link (never a bare text blob) so the receiving app can
 * render a preview card and the tap lands on the quest.
 *
 * @returns true when the link was copied to the clipboard (caller should toast).
 */
export async function shareQuest(quest: Quest): Promise<boolean> {
  const url = questUrl(quest);
  const label = quest.isSideQuest ? 'SideQuest' : 'Quest';

  if (navigator.share) {
    try {
      await navigator.share({
        title: quest.title,
        text: `${label}: ${quest.title}`,
        url,
      });
      return false;
    } catch {
      // User dismissed the sheet, or the share failed — fall through to copy.
    }
  }

  try {
    await navigator.clipboard?.writeText(url);
    return true;
  } catch {
    return false;
  }
}
