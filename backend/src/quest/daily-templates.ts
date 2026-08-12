import { Category } from './enums/category.enum.js';
import { Difficulty } from './enums/difficulty.enum.js';

/**
 * Pool of small, repeatable everyday tasks. Three of these are drawn per user
 * per day (see QuestService.generateDailySideQuests) and completed by
 * self-report — no GPS, no travel, nothing that can fail because of where you
 * happen to be. Clearing all three secures the day and extends the streak,
 * so every entry here must be doable in a few minutes on an ordinary day.
 *
 * Separate from SIDEQUEST_TEMPLATES on purpose: those spawn on the map and
 * carry location, TTL and quest-giver semantics.
 */
export interface DailyQuestTemplate {
  id: string;
  title: string;
  description: string;
  category: Category;
  difficulty: Difficulty;
  /** Flavor icon shown in the logbook row. */
  emoji: string;
}

export const DAILY_QUEST_TEMPLATES: DailyQuestTemplate[] = [
  // ── Sport / Bewegung ──────────────────────────────────────────────────────
  {
    id: 'dq_stretch',
    title: 'Morgendehnung',
    description: 'Dehne dich 2 Minuten lang, sobald du aufstehst.',
    category: Category.SPORT,
    difficulty: Difficulty.EASY,
    emoji: '🧘',
  },
  {
    id: 'dq_stairs',
    title: 'Treppenläufer',
    description:
      'Nimm heute mindestens einmal die Treppe statt Aufzug oder Rolltreppe.',
    category: Category.SPORT,
    difficulty: Difficulty.EASY,
    emoji: '🪜',
  },
  {
    id: 'dq_walk_ten',
    title: 'Zehn Minuten',
    description: 'Geh 10 Minuten spazieren — Kopf lüften zählt als Training.',
    category: Category.SPORT,
    difficulty: Difficulty.EASY,
    emoji: '🚶',
  },
  {
    id: 'dq_squats',
    title: 'Zwanzig Kniebeugen',
    description: 'Mach 20 Kniebeugen. Am Stück oder über den Tag verteilt.',
    category: Category.SPORT,
    difficulty: Difficulty.EASY,
    emoji: '🦵',
  },
  {
    id: 'dq_pushups',
    title: 'Zehn Liegestütze',
    description: 'Zehn Liegestütze. Auf den Knien zählen auch.',
    category: Category.SPORT,
    difficulty: Difficulty.EASY,
    emoji: '💪',
  },
  {
    id: 'dq_plank',
    title: 'Planke halten',
    description: 'Halte 30 Sekunden die Planke. Zittern ist erlaubt.',
    category: Category.SPORT,
    difficulty: Difficulty.MEDIUM,
    emoji: '⏱️',
  },
  {
    id: 'dq_dance',
    title: 'Ein Lied lang tanzen',
    description:
      'Dreh ein Lied auf und tanz es komplett durch. Türe zu, niemand schaut.',
    category: Category.SPORT,
    difficulty: Difficulty.EASY,
    emoji: '🕺',
  },
  {
    id: 'dq_water',
    title: 'Ein Glas mehr',
    description: 'Trink ein zusätzliches großes Glas Wasser.',
    category: Category.SPORT,
    difficulty: Difficulty.EASY,
    emoji: '💧',
  },
  {
    id: 'dq_one_stop_early',
    title: 'Eine Station früher',
    description:
      'Steig eine Station früher aus oder park eine Straße weiter — den Rest zu Fuß.',
    category: Category.SPORT,
    difficulty: Difficulty.MEDIUM,
    emoji: '🚏',
  },
  {
    id: 'dq_shoulders',
    title: 'Schulterlockerung',
    description: 'Kreise 20-mal die Schultern und roll den Nacken aus.',
    category: Category.SPORT,
    difficulty: Difficulty.EASY,
    emoji: '🙆',
  },
  {
    id: 'dq_fresh_air',
    title: 'Frische Luft',
    description: 'Geh einmal bewusst nach draußen und atme zehnmal tief durch.',
    category: Category.SPORT,
    difficulty: Difficulty.EASY,
    emoji: '🌬️',
  },
  {
    id: 'dq_no_lift_day',
    title: 'Beine statt Motor',
    description:
      'Leg eine kurze Strecke zu Fuß oder mit dem Rad zurück statt mit dem Auto.',
    category: Category.SPORT,
    difficulty: Difficulty.MEDIUM,
    emoji: '🚲',
  },

  // ── Social ────────────────────────────────────────────────────────────────
  {
    id: 'dq_compliment',
    title: 'Ehrliches Kompliment',
    description: 'Mach einer Person heute ein echtes Kompliment.',
    category: Category.SOCIAL,
    difficulty: Difficulty.EASY,
    emoji: '💬',
  },
  {
    id: 'dq_old_message',
    title: 'Späte Antwort',
    description: 'Beantworte die Nachricht, die seit Tagen ungelesen wartet.',
    category: Category.SOCIAL,
    difficulty: Difficulty.EASY,
    emoji: '📩',
  },
  {
    id: 'dq_call_friend',
    title: 'Kurzer Anruf',
    description:
      'Ruf jemanden an, mit dem du schon länger nicht gesprochen hast — fünf Minuten reichen.',
    category: Category.SOCIAL,
    difficulty: Difficulty.MEDIUM,
    emoji: '📞',
  },
  {
    id: 'dq_greet_stranger',
    title: 'Freundlicher Gruß',
    description:
      'Grüße eine fremde Person freundlich — Nachbarin, Busfahrer, Kassiererin.',
    category: Category.SOCIAL,
    difficulty: Difficulty.EASY,
    emoji: '👋',
  },
  {
    id: 'dq_hold_door',
    title: 'Tür aufhalten',
    description: 'Halte jemandem die Tür auf oder lass jemanden vor.',
    category: Category.SOCIAL,
    difficulty: Difficulty.EASY,
    emoji: '🚪',
  },
  {
    id: 'dq_say_thanks',
    title: 'Danke sagen',
    description:
      'Bedank dich bei jemandem für etwas Konkretes, das dir aufgefallen ist.',
    category: Category.SOCIAL,
    difficulty: Difficulty.EASY,
    emoji: '🙏',
  },
  {
    id: 'dq_help_someone',
    title: 'Kleine Hilfe',
    description: 'Hilf jemandem ungefragt bei einer Kleinigkeit.',
    category: Category.SOCIAL,
    difficulty: Difficulty.MEDIUM,
    emoji: '🤝',
  },
  {
    id: 'dq_text_family',
    title: 'Lebenszeichen',
    description: 'Schreib jemandem aus der Familie, wie es dir gerade geht.',
    category: Category.SOCIAL,
    difficulty: Difficulty.EASY,
    emoji: '👨‍👩‍👧',
  },
  {
    id: 'dq_make_laugh',
    title: 'Ein Lachen',
    description: 'Bring heute jemanden zum Lachen.',
    category: Category.SOCIAL,
    difficulty: Difficulty.MEDIUM,
    emoji: '😄',
  },
  {
    id: 'dq_listen_fully',
    title: 'Ganz zuhören',
    description: 'Führ ein Gespräch, ohne einmal aufs Handy zu schauen.',
    category: Category.SOCIAL,
    difficulty: Difficulty.MEDIUM,
    emoji: '👂',
  },
  {
    id: 'dq_share_find',
    title: 'Fund teilen',
    description:
      'Schick jemandem ein Bild, Lied oder Video, das genau zu dieser Person passt.',
    category: Category.SOCIAL,
    difficulty: Difficulty.EASY,
    emoji: '🎁',
  },
  {
    id: 'dq_praise_worker',
    title: 'Lob nach oben',
    description:
      'Sag jemandem, der dich heute bedient oder bedient hat, dass er seinen Job gut macht.',
    category: Category.SOCIAL,
    difficulty: Difficulty.EASY,
    emoji: '⭐',
  },

  // ── Abenteuer ─────────────────────────────────────────────────────────────
  {
    id: 'dq_new_street',
    title: 'Neue Abzweigung',
    description:
      'Nimm einmal einen Weg, den du noch nie gegangen bist — und sei es ein Umweg.',
    category: Category.ADVENTURE,
    difficulty: Difficulty.MEDIUM,
    emoji: '🛤️',
  },
  {
    id: 'dq_try_new_taste',
    title: 'Neuer Geschmack',
    description: 'Probier etwas, das du noch nie gegessen oder getrunken hast.',
    category: Category.ADVENTURE,
    difficulty: Difficulty.MEDIUM,
    emoji: '🍽️',
  },
  {
    id: 'dq_photo_sky',
    title: 'Himmelsbild',
    description:
      'Mach ein Foto vom Himmel über dir — heute sieht er nie wieder so aus.',
    category: Category.ADVENTURE,
    difficulty: Difficulty.EASY,
    emoji: '📷',
  },
  {
    id: 'dq_new_door',
    title: 'Unbekannte Schwelle',
    description:
      'Betritt einen Laden, ein Café oder einen Park, wo du noch nie warst.',
    category: Category.ADVENTURE,
    difficulty: Difficulty.MEDIUM,
    emoji: '🏪',
  },
  {
    id: 'dq_phone_free_walk',
    title: 'Ohne Bildschirm',
    description: 'Geh 10 Minuten, ohne einmal aufs Handy zu schauen.',
    category: Category.ADVENTURE,
    difficulty: Difficulty.MEDIUM,
    emoji: '📵',
  },
  {
    id: 'dq_sunrise_sunset',
    title: 'Randstunde',
    description: 'Schau dir bewusst den Sonnenauf- oder -untergang an.',
    category: Category.ADVENTURE,
    difficulty: Difficulty.MEDIUM,
    emoji: '🌅',
  },
  {
    id: 'dq_new_route',
    title: 'Anderer Anmarsch',
    description:
      'Nimm einen anderen Weg zur Arbeit, Schule oder zum Einkaufen als sonst.',
    category: Category.ADVENTURE,
    difficulty: Difficulty.EASY,
    emoji: '🧭',
  },
  {
    id: 'dq_collect_token',
    title: 'Andenken',
    description:
      'Nimm draußen eine Kleinigkeit mit — Blatt, Stein, Ticket — als Andenken an heute.',
    category: Category.ADVENTURE,
    difficulty: Difficulty.EASY,
    emoji: '🍂',
  },
  {
    id: 'dq_new_song',
    title: 'Unbekannter Klang',
    description: 'Hör ein Lied aus einem Genre, das du sonst nie hörst.',
    category: Category.ADVENTURE,
    difficulty: Difficulty.EASY,
    emoji: '🎧',
  },
  {
    id: 'dq_sit_new_spot',
    title: 'Neuer Platz',
    description:
      'Setz dich für fünf Minuten an einen Ort, an dem du noch nie gesessen hast.',
    category: Category.ADVENTURE,
    difficulty: Difficulty.EASY,
    emoji: '🪑',
  },

  // ── Skill ─────────────────────────────────────────────────────────────────
  {
    id: 'dq_three_words',
    title: 'Drei Vokabeln',
    description: 'Lerne drei neue Wörter in einer Fremdsprache.',
    category: Category.SKILL,
    difficulty: Difficulty.EASY,
    emoji: '🗣️',
  },
  {
    id: 'dq_ten_pages',
    title: 'Zehn Seiten',
    description: 'Lies zehn Seiten in einem Buch.',
    category: Category.SKILL,
    difficulty: Difficulty.MEDIUM,
    emoji: '📖',
  },
  {
    id: 'dq_practice_five',
    title: 'Fünf Minuten Übung',
    description: 'Übe fünf Minuten etwas, das du besser können willst.',
    category: Category.SKILL,
    difficulty: Difficulty.EASY,
    emoji: '🎯',
  },
  {
    id: 'dq_learn_topic',
    title: 'Neues Wissen',
    description:
      'Lies oder schau etwas über ein Thema, von dem du bisher nichts weißt.',
    category: Category.SKILL,
    difficulty: Difficulty.EASY,
    emoji: '🔎',
  },
  {
    id: 'dq_journal',
    title: 'Drei Sätze',
    description: 'Schreib drei Sätze über deinen Tag auf.',
    category: Category.SKILL,
    difficulty: Difficulty.EASY,
    emoji: '✍️',
  },
  {
    id: 'dq_new_word',
    title: 'Wortschatz',
    description:
      'Schlag ein deutsches Wort nach, das du zwar kennst, aber nie erklären könntest.',
    category: Category.SKILL,
    difficulty: Difficulty.EASY,
    emoji: '📚',
  },
  {
    id: 'dq_head_math',
    title: 'Kopfrechnen',
    description: 'Rechne die nächste Rechnung im Kopf statt mit dem Handy.',
    category: Category.SKILL,
    difficulty: Difficulty.EASY,
    emoji: '🧮',
  },
  {
    id: 'dq_cook_something',
    title: 'Selbst gekocht',
    description: 'Koch oder bereite dir eine Mahlzeit selbst zu.',
    category: Category.SKILL,
    difficulty: Difficulty.MEDIUM,
    emoji: '🍳',
  },
  {
    id: 'dq_doodle',
    title: 'Fünf Minuten Kritzeln',
    description: 'Zeichne fünf Minuten irgendetwas. Es muss nicht gut werden.',
    category: Category.SKILL,
    difficulty: Difficulty.EASY,
    emoji: '🖊️',
  },
  {
    id: 'dq_tidy_five',
    title: 'Fünf Dinge',
    description: 'Räum fünf Dinge an ihren Platz zurück.',
    category: Category.SKILL,
    difficulty: Difficulty.EASY,
    emoji: '🧹',
  },
  {
    id: 'dq_plan_tomorrow',
    title: 'Morgen im Blick',
    description: 'Schreib die drei wichtigsten Dinge für morgen auf.',
    category: Category.SKILL,
    difficulty: Difficulty.EASY,
    emoji: '🗓️',
  },

  // ── Mystery ───────────────────────────────────────────────────────────────
  {
    id: 'dq_count_color',
    title: 'Zählauftrag',
    description:
      'Zähle auf deinem nächsten Weg alle roten Türen, die du siehst.',
    category: Category.MYSTERY,
    difficulty: Difficulty.EASY,
    emoji: '🚩',
  },
  {
    id: 'dq_hidden_detail',
    title: 'Übersehenes Detail',
    description:
      'Finde an einem Gebäude, an dem du täglich vorbeikommst, ein Detail, das dir nie aufgefallen ist.',
    category: Category.MYSTERY,
    difficulty: Difficulty.MEDIUM,
    emoji: '🔍',
  },
  {
    id: 'dq_listen_sounds',
    title: 'Horchprobe',
    description:
      'Schließ zwei Minuten die Augen und zähle, wie viele verschiedene Geräusche du hörst.',
    category: Category.MYSTERY,
    difficulty: Difficulty.EASY,
    emoji: '🔊',
  },
  {
    id: 'dq_find_year',
    title: 'Jahreszahl',
    description:
      'Finde in deiner Umgebung eine eingravierte oder aufgemalte Jahreszahl.',
    category: Category.MYSTERY,
    difficulty: Difficulty.MEDIUM,
    emoji: '🗿',
  },
  {
    id: 'dq_plate_sentence',
    title: 'Kennzeichen-Orakel',
    description:
      'Merk dir ein Nummernschild und bilde aus den Buchstaben einen Satz.',
    category: Category.MYSTERY,
    difficulty: Difficulty.EASY,
    emoji: '🔡',
  },
  {
    id: 'dq_watch_bird',
    title: 'Vogelbeobachtung',
    description:
      'Beobachte eine Minute lang einen Vogel und schau, was er treibt.',
    category: Category.MYSTERY,
    difficulty: Difficulty.EASY,
    emoji: '🐦',
  },
  {
    id: 'dq_invent_story',
    title: 'Erfundene Geschichte',
    description:
      'Denk dir zu einer fremden Person eine komplette Lebensgeschichte aus.',
    category: Category.MYSTERY,
    difficulty: Difficulty.EASY,
    emoji: '🎭',
  },
  {
    id: 'dq_find_blue',
    title: 'Farbjagd',
    description:
      'Finde fünf blaue Dinge in deiner Umgebung, ohne dich vom Fleck zu bewegen.',
    category: Category.MYSTERY,
    difficulty: Difficulty.EASY,
    emoji: '🔵',
  },
  {
    id: 'dq_look_up',
    title: 'Blick nach oben',
    description:
      'Schau beim Gehen einmal bewusst über die Erdgeschosse hinauf — dort ist die schönere Stadt.',
    category: Category.MYSTERY,
    difficulty: Difficulty.EASY,
    emoji: '🏛️',
  },
  {
    id: 'dq_smell_memory',
    title: 'Geruchsspur',
    description: 'Finde einen Geruch, der dich an etwas Bestimmtes erinnert.',
    category: Category.MYSTERY,
    difficulty: Difficulty.MEDIUM,
    emoji: '👃',
  },
  {
    id: 'dq_three_good',
    title: 'Drei gute Dinge',
    description: 'Nenne dir vor dem Schlafen drei Dinge, die heute gut waren.',
    category: Category.MYSTERY,
    difficulty: Difficulty.EASY,
    emoji: '🌙',
  },
  {
    id: 'dq_silent_minute',
    title: 'Stille Minute',
    description: 'Sitz eine Minute völlig still da und tu gar nichts.',
    category: Category.MYSTERY,
    difficulty: Difficulty.EASY,
    emoji: '🤫',
  },
];

export function getDailyQuestTemplate(
  id: string,
): DailyQuestTemplate | undefined {
  return DAILY_QUEST_TEMPLATES.find((t) => t.id === id);
}
