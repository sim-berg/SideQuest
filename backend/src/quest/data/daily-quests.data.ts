export interface DailyQuestTemplate {
  title: string;
  description: string;
  category: 'sport' | 'social' | 'adventure' | 'skill' | 'mystery';
}

export const DAILY_QUESTS_POOL: DailyQuestTemplate[] = [
  {
    title: 'Mach dein Bett',
    description: 'Stehe auf und mache dein Bett. Ein aufgeräumtes Bett ist ein guter Start in den Tag!',
    category: 'skill',
  },
  {
    title: 'Lüfte 5 Minuten',
    description: 'Öffne ein Fenster und lüfte deinen Raum für 5 Minuten. Frische Luft tut gut!',
    category: 'adventure',
  },
  {
    title: 'Hebe Müll im Umkreis auf',
    description: 'Geh raus in deine Nähe und hebe Müll auf, den du findest. Die Welt wird sauberer!',
    category: 'adventure',
  },
  {
    title: 'Trink 2 Gläser Wasser',
    description: 'Trinke 2 Gläser Wasser und bleibe hydratisiert. Dein Körper wird es dir danken!',
    category: 'skill',
  },
  {
    title: 'Mach 20 Liegestütze',
    description: 'Kräftige deine Arme und Brust mit 20 Liegestützen. Du schaffst das!',
    category: 'sport',
  },
  {
    title: 'Schreib 3 Dinge auf, für die du dankbar bist',
    description: 'Nimm dir 2 Minuten Zeit und schreib 3 Dinge auf, wofür du heute dankbar bist.',
    category: 'skill',
  },
  {
    title: 'Mach einen 10-Minuten-Spaziergang',
    description: 'Spaziere 10 Minuten durch deine Nachbarschaft. Die Bewegung tut dir gut!',
    category: 'sport',
  },
  {
    title: 'Wasche dein Gesicht mit Wasser',
    description: 'Erfrische dein Gesicht mit kaltem Wasser. Das belebt dich!',
    category: 'skill',
  },
  {
    title: 'Strecke dich 2 Minuten',
    description: 'Dehne dein Körper für 2 Minuten. Das entspannt deine Muskeln!',
    category: 'sport',
  },
  {
    title: 'Mach jemanden ein Kompliment',
    description: 'Schreib jemandem eine Nachricht mit einem ehrlichen Kompliment. Verbreite Freude!',
    category: 'social',
  },
  {
    title: 'Räume deinen Schreibtisch auf',
    description: 'Sortiere und putze deinen Schreibtisch. Ein sauberer Platz hilft beim Fokus!',
    category: 'skill',
  },
  {
    title: 'Höre eine Minute Naturgeräusche',
    description: 'Setz dich hin, schließ die Augen und höre eine Minute lang Naturgeräusche (Vogel, Wind, Wasser).',
    category: 'adventure',
  },
  {
    title: 'Mach 15 Kniebeugen',
    description: 'Kräftige deine Beine mit 15 Kniebeugen. Ohne Ausrüstung möglich!',
    category: 'sport',
  },
  {
    title: 'Schreib eine Nachricht an einen alten Freund',
    description: 'Melde dich bei jemandem, mit dem du lange nicht geschrieben hast.',
    category: 'social',
  },
  {
    title: 'Meditiere 3 Minuten',
    description: 'Setz dich hin und meditiere 3 Minuten lang. Beruhige deinen Geist!',
    category: 'skill',
  },
  {
    title: 'Spüle dein Geschirr ab',
    description: 'Räume deine Küche auf und spüle dein Geschirr. Ein sauberer Raum ist beruhigend!',
    category: 'skill',
  },
  {
    title: 'Mach 10 Burpees',
    description: 'Trainiere mit 10 Burpees für maximale Fitness. Intensive Übung!',
    category: 'sport',
  },
  {
    title: 'Schreib eine Nachricht an einen Familienmitglied',
    description: 'Kontaktiere einen lieben Menschen in deiner Familie.',
    category: 'social',
  },
  {
    title: 'Lese 5 Seiten eines Buches',
    description: 'Lese 5 Seiten eines Buches deiner Wahl. Erweitere dein Wissen!',
    category: 'skill',
  },
  {
    title: 'Mach 30 Sekunden Plank',
    description: 'Halte 30 Sekunden in einer Planke. Trainiere deinen Core!',
    category: 'sport',
  },
];
