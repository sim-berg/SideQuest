export type ZoneType = 'taverne' | 'arena' | 'bibliothek' | 'tempel';
export type NpcQuestType = 'daily' | 'weekly';
export type PlayerFacing = 'up' | 'down' | 'left' | 'right';

export interface NpcDef {
  id: string;
  name: string;
  tileX: number;
  tileY: number;
  bodyColor: string;
  accentColor: string;
  /** Short greeting line */
  greeting: string;
}

export interface ZoneDef {
  type: ZoneType;
  name: string;
  description: string;
  unlockHint: string;
  /** Overpass amenity tags that satisfy the GPS requirement */
  osmAmenities: string[];
  unlockRadius: number;
  tileMap: number[][];
  /** Full map dimensions (tileMap columns / rows) */
  mapW: number;
  mapH: number;
  /** Filename under /rpg/ for the pre-rendered room background */
  bgImage: string;
  npcs: NpcDef[];
  playerSpawnX: number;
  playerSpawnY: number;
  floorColor: string;
  wallColor: string;
  accentColor: string;
  bgGradient: [string, string];
}

export interface RpgQuest {
  id: string;
  zoneType: ZoneType;
  questType: NpcQuestType;
  npcId: string;
  npcName: string;
  title: string;
  description: string;
  requirements: string;
  xpReward: number;
  assignmentId: string | null;
  completedAt: string | null;
  expiresAt: string | null;
  isCompleted: boolean;
  canComplete: boolean;
}

export interface CompleteQuestResult {
  xpAwarded: number;
  bonusBreakdown: {
    baseXp: number;
    firstOfDayBonus: number;
    streakMultiplier: number;
    streak: number;
  } | null;
  dragon: unknown;
  quest: {
    id: string;
    title: string;
    xpReward: number;
    zoneType: ZoneType;
    questType: NpcQuestType;
  };
}

export interface GameState {
  playerX: number;
  playerY: number;
  playerFacing: PlayerFacing;
  frame: number;
  lastMove: number;
}
