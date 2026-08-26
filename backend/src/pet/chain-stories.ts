/**
 * Story templates for the pet's detective journeys: small multi-step
 * mysteries whose stations are randomly placed waypoints around the player.
 * Each step's clue is revealed when the previous station is reached; the
 * finale grants XP, a perk, and sometimes a fresh mystery egg.
 */
export interface ChainStoryStep {
  title: string;
  clue: string;
}

export interface ChainStory {
  id: string;
  title: string;
  /** The pet's pitch when offering the journey. */
  intro: string;
  steps: ChainStoryStep[];
  conclusion: string;
  perkId: string;
  /** Probability (0-1) that the finale also drops a mystery egg. */
  eggChance: number;
}

export const CHAIN_STORIES: ChainStory[] = [
  {
    id: 'hutmacher',
    title: 'Das Rätsel des verrückten Hutmachers',
    intro:
      'Ich habe von einem verrückten Hutmacher gehört, der hier in der Gegend seinen legendären Schildkrötenhut verloren hat! Kommst du mit auf Spurensuche?',
    steps: [
      {
        title: 'Die verlorene Hutschachtel',
        clue: 'Der Hutmacher rannte kopflos davon — seine leere Hutschachtel soll er hier irgendwo fallen gelassen haben. Lass uns die Stelle untersuchen!',
      },
      {
        title: 'Das grüne Band',
        clue: 'In der Schachtel: nur ein grünes Samtband! Es riecht nach Teichwasser. Die Spur führt weiter — dort drüben muss etwas sein.',
      },
      {
        title: 'Die Zeugin mit den Flügeln',
        clue: 'Eine Taube hat alles gesehen! Sie gurrte etwas von einem "wandelnden Hut auf vier Beinen". Folgen wir ihrer Blickrichtung!',
      },
      {
        title: 'Der Schildkrötenhut',
        clue: 'Da! Frische Schleifspuren im Staub — der Hut ist nicht verloren, er ist WEGGELAUFEN. An dieser Stelle muss er sich verstecken!',
      },
    ],
    conclusion:
      'Ihr habt ihn! Der Schildkrötenhut war in Wahrheit eine echte Schildkröte, die der Hutmacher im Halbschlaf für einen Hut hielt. Sie döst jetzt zufrieden in der Sonne — und der Hutmacher näht ihr zum Dank ein winziges Mützchen.',
    perkId: 'spuersinn',
    eggChance: 0.35,
  },
  {
    id: 'gadget',
    title: 'Das verlorene Gadget',
    intro:
      'Jemand hat hier ein geheimnisvolles Gadget verloren — es piept in einer Frequenz, die nur ich hören kann! Bergen wir es, bevor der Akku leer ist?',
    steps: [
      {
        title: 'Das erste Piepen',
        clue: 'Piep … piep … Das Signal ist schwach, aber es kommt eindeutig aus dieser Richtung. Lauf mit mir dorthin!',
      },
      {
        title: 'Die Datenspur',
        clue: 'Hier lag es mal — jemand hat es aufgehoben und wieder fallen lassen! Das Signal springt jetzt woandershin. Weiter!',
      },
      {
        title: 'Interferenzen',
        clue: 'Irgendetwas stört das Signal … eine zweite Frequenz! Von diesem Punkt aus müssten wir beide Quellen anpeilen können.',
      },
      {
        title: 'Die Bergung',
        clue: 'Jetzt ist es ganz laut! PIEP PIEP PIEP! Es muss genau hier sein — hilf mir suchen!',
      },
    ],
    conclusion:
      'Gefunden! Das "Gadget" ist ein alter Schrittzähler — und er zeigt exakt die Strecke an, die ihr gerade gelaufen seid. Vielleicht wollte er einfach nur mal wieder spazieren getragen werden.',
    perkId: 'wanderlust',
    eggChance: 0.35,
  },
  {
    id: 'gluehwuermchen',
    title: 'Die Spur der Glühwürmchen',
    intro:
      'Die Glühwürmchen der Gegend haben ihre Leuchtkraft verloren! Ihre Lichtspur führt kreuz und quer durchs Viertel. Finden wir heraus, was passiert ist?',
    steps: [
      {
        title: 'Das erloschene Licht',
        clue: 'Hier hat das letzte Glühwürmchen geleuchtet, bevor es dunkel wurde. Am Boden: winzige Glitzerspuren. Sie führen weiter!',
      },
      {
        title: 'Der Glitzerpfad',
        clue: 'Die Glitzerspur wird dichter! Irgendetwas hat das Licht der Würmchen eingesammelt und hier entlang getragen.',
      },
      {
        title: 'Das Lichtversteck',
        clue: 'Die Spur endet an einem Versteck — ich kann ein schwaches Glimmen spüren. Ganz nah jetzt!',
      },
    ],
    conclusion:
      'Eine Elster! Sie hat das Leuchten in ihrem Nest gehortet, weil es so hübsch funkelt. Ihr handelt einen Deal aus: Die Würmchen leuchten ihr jeden Abend einmal vor, dafür gibt sie das gestohlene Licht zurück. Das Viertel glimmt wieder.',
    perkId: 'adlerauge',
    eggChance: 0.35,
  },
  {
    id: 'singende_steine',
    title: 'Das Rätsel der singenden Steine',
    intro:
      'Hörst du das auch? Manche Steine hier summen eine Melodie, wenn niemand hinsieht. Ich will wissen, was sie singen — du auch?',
    steps: [
      {
        title: 'Der Brummstein',
        clue: 'Der erste singende Stein soll genau dort liegen. Leg dein Ohr an — oder lass mich lauschen, ich bin näher am Boden.',
      },
      {
        title: 'Die zweite Strophe',
        clue: 'Der Stein summte drei Töne — und die Melodie geht woanders weiter! Das Lied wandert von Stein zu Stein. Hinterher!',
      },
      {
        title: 'Der Taktgeber',
        clue: 'Jetzt summt es im Rhythmus deiner Schritte! Das Lied will uns irgendwohin führen. Dort vorne wird es lauter!',
      },
      {
        title: 'Das Finale',
        clue: 'Alle Steine singen jetzt zusammen — das große Finale muss genau hier stattfinden. Bereit?',
      },
    ],
    conclusion:
      'Das Lied war ein uraltes Wanderlied der Straße selbst — sie singt für alle, die zu Fuß unterwegs sind, aber nur die wenigsten hören je hin. Ihr beide kennt jetzt den Refrain. Er klingt am schönsten bei Gegenwind.',
    perkId: 'seelenband',
    eggChance: 0.4,
  },
  {
    id: 'schatten_kiosk',
    title: 'Der Schatten am Kiosk',
    intro:
      'Am Kiosk geht ein Schatten um, der Kleingeld stibitzt und dafür Kastanien dalässt. Ein Fall für uns zwei, findest du nicht?',
    steps: [
      {
        title: 'Der Tatort',
        clue: 'Hier wurde zuletzt getauscht: 30 Cent weg, drei Kastanien da. Der Täter muss Pfoten haben. Untersuchen wir die Umgebung!',
      },
      {
        title: 'Die Kastanienspur',
        clue: 'Eine fallengelassene Kastanie … und noch eine! Der Täter hat ein Loch in der Tasche. Die Spur führt genau dorthin.',
      },
      {
        title: 'Das Beobachtungsversteck',
        clue: 'Von diesem Punkt aus kann man den Kiosk perfekt sehen. Hier hat der Schatten gelauert und gewartet. Da — eine Bewegung!',
      },
      {
        title: 'Die Konfrontation',
        clue: 'Wir haben ihn eingekreist! Der Schatten sitzt genau dort und … knackt seelenruhig eine Kastanie?',
      },
    ],
    conclusion:
      'Der Meisterdieb ist ein Eichhörnchen mit Geschäftssinn: Es hielt die Münzen für besonders glänzende Nüsse und wollte fair tauschen. Ihr einigt euch auf einen Wechselkurs — eine Kastanie pro Streicheleinheit. Der Kiosk bekommt sein Kleingeld zurück.',
    perkId: 'glueckspfote',
    eggChance: 0.35,
  },
  {
    id: 'vergessene_melodie',
    title: 'Die vergessene Melodie',
    intro:
      'In meinen Träumen höre ich seit Tagen dieselbe Melodie — sie kommt von irgendwo hier draußen. Hilfst du mir, ihre Quelle zu finden?',
    steps: [
      {
        title: 'Das erste Echo',
        clue: 'Dort drüben war die Melodie am lautesten in meinem Traum. Lass uns dort anfangen und die Ohren spitzen.',
      },
      {
        title: 'Der Windwechsel',
        clue: 'Der Wind trägt die Töne weiter! Wenn wir ihm folgen, kommen wir der Quelle näher. Dorthin!',
      },
      {
        title: 'Die Quelle',
        clue: 'Ganz nah! Die Melodie ist jetzt deutlich — sie klingt wie … Summen? Genau an dieser Stelle müssen wir suchen.',
      },
    ],
    conclusion:
      'Die Quelle: ein alter, windschiefer Zaun, durch dessen Astlöcher der Wind pfeift — für Menschenohren nur Rauschen, für Wesen wie mich ein Schlaflied. Ihr bleibt eine Weile stehen und hört zu. Manche Lieder brauchen keinen Komponisten.',
    perkId: 'funkenherz',
    eggChance: 0.4,
  },
];

export function getChainStory(id: string): ChainStory | undefined {
  return CHAIN_STORIES.find((s) => s.id === id);
}
