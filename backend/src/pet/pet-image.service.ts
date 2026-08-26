import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Pet, PetDocument } from './schemas/pet.schema.js';
import { PetStage } from './enums/pet-stage.enum.js';
import { Element } from './enums/element.enum.js';
import { ELEMENTS, getSpeciesDef } from './pet-catalog.js';
import { ReplicateService } from '../achievement/replicate.service.js';
import { getTreasureItem } from '../treasure/treasure-catalog.js';
import { CoinService } from '../coin/coin.service.js';
import { PORTRAIT_REGEN_COST } from '../coin/coin.constants.js';

/** English stage wording for the image prompt. */
const STAGE_PROMPT: Record<string, string> = {
  [PetStage.HATCHLING]: 'newly hatched baby, big curious eyes, tiny and clumsy',
  [PetStage.JUVENILE]:
    'young adolescent, playful and energetic, growing into its powers',
  [PetStage.ADULT]: 'majestic fully grown creature, confident and powerful',
  [PetStage.ANCIENT]:
    'ancient mythical elder, awe-inspiring, adorned with glowing runes and marks of countless adventures',
};

/** English element wording for the image prompt. */
const ELEMENT_PROMPT: Record<Element, string> = {
  [Element.FEUER]:
    'fire elemental, ember glow, flames flickering along its body',
  [Element.WASSER]:
    'water elemental, flowing aquatic features, droplets and gentle waves',
  [Element.WIND]:
    'wind elemental, swirling air currents, feather-light and swift',
  [Element.ERDE]: 'earth elemental, mossy stone skin, sturdy and grounded',
  [Element.BLITZ]: 'lightning elemental, crackling sparks, electric arcs',
  [Element.METALL]: 'metal elemental, polished chrome and brass plating',
  [Element.LICHT]:
    'light elemental, radiant golden shimmer, halo of soft light',
  [Element.SCHATTEN]:
    'shadow elemental, wisps of dark mist, glowing violet eyes',
  [Element.CHAOS]:
    'chaos elemental, swirling impossible colors, reality bending around it',
  [Element.KRISTALL]:
    'crystal elemental, translucent gemstone facets, prismatic sparkle',
  [Element.NATUR]: 'nature elemental, leaves and blossoms growing from its fur',
  [Element.GEIST]: 'ghost elemental, semi-transparent, ethereal glow',
  [Element.FEE]: 'fairy elemental, iridescent wings, sparkling pixie dust',
  [Element.EIS]: 'ice elemental, frost patterns, snowflakes drifting around it',
  [Element.GIFT]: 'poison elemental, toxic green haze, dripping venom accents',
  [Element.KOSMOS]:
    'cosmic elemental, starfield fur, tiny galaxies orbiting it',
};

/**
 * How a pet's lived quest history shows up in its unique portrait: the
 * dominant soulXp categories translate to visible traits.
 */
const CATEGORY_TRAIT: Record<string, string> = {
  sport:
    'athletic and battle-ready, toned body, dynamic energetic pose, sweatband-style markings',
  social:
    'warm radiant expression, festive charms and friendship tokens woven into its fur',
  adventure:
    'weathered explorer look, tiny satchel and rolled map, wind-swept fur, distant-horizon gaze',
  skill:
    'clever focused eyes, softly glowing sigils of mastery orbiting its head',
  mystery:
    'enigmatic aura, wisps of arcane mist curling around it, faint mysterious runes',
};

/**
 * The visual identity of a pet.
 *
 *  - HATCHLING: one shared portrait per (species, element) combination —
 *    cheap, instantly recognizable, and this stage arrives minutes after
 *    the first cleared daily board.
 *  - JUVENILE and beyond: a one-of-a-kind, soul-infused portrait per pet.
 *    The prompt encodes how this individual actually lived: dominant
 *    soulXp categories, equipped treasures and its soul.md quirks. The
 *    image is stored on the pet document, so it travels along in trades.
 *
 * Evolution triggers background pre-generation (see PetService), so the
 * portrait is usually ready by the time the evolution ceremony ends.
 */
@Injectable()
export class PetImageService {
  private readonly logger = new Logger(PetImageService.name);
  // De-dupes concurrent generations (pregenerate + a UI fetch racing).
  private readonly inflight = new Map<string, Promise<string>>();

  constructor(
    @InjectModel(Pet.name) private petModel: Model<PetDocument>,
    private readonly replicate: ReplicateService,
    private readonly coinService: CoinService,
  ) {}

  /** Portrait for the pet's current stage, generating it on first request. */
  async getImage(petId: string): Promise<{ imageUrl: string | null }> {
    const doc = await this.petModel.findById(petId).exec();
    if (!doc) throw new NotFoundException('Pet nicht gefunden');

    // Unhatched eggs have no species yet — the UI shows the egg art.
    if (!doc.species || !doc.element || doc.stage === PetStage.EGG) {
      return { imageUrl: null };
    }

    const existing = (doc.images ?? {})[doc.stage];
    if (existing) return { imageUrl: existing };

    return { imageUrl: await this.generateAndStore(doc) };
  }

  /**
   * Throw away the cached portrait for the pet's current stage and paint a
   * fresh one. Owner-only. If the new generation fails, the old portrait
   * stays. The returned URL carries a cache-buster so clients re-render.
   */
  async regenerate(
    userId: string,
    petId: string,
  ): Promise<{ imageUrl: string | null }> {
    const doc = await this.petModel.findById(petId).exec();
    if (!doc) throw new NotFoundException('Pet nicht gefunden');
    if (doc.userId !== userId)
      throw new ForbiddenException('Nicht dein Gefährte');
    // Eggs have no portrait; hatchling portraits are shared per
    // species+element combo, so repainting one would change them all.
    if (
      !doc.species ||
      !doc.element ||
      doc.stage === PetStage.EGG ||
      doc.stage === PetStage.HATCHLING
    ) {
      return { imageUrl: null };
    }

    // Repainting costs coins. Burn first (the overdraft guard decides),
    // refund if no new portrait came out of it.
    const ref = { refType: 'pet', refId: petId };
    await this.coinService.burn(
      userId,
      PORTRAIT_REGEN_COST,
      'portrait_regen',
      ref,
    );

    const before = (doc.images ?? {})[doc.stage] ?? null;
    const imageUrl = await this.generateAndStore(doc, true);
    const gotNewImage = imageUrl !== before && !imageUrl.startsWith('data:');
    if (!gotNewImage) {
      await this.coinService.mint(
        userId,
        PORTRAIT_REGEN_COST,
        'portrait_regen_refund',
        ref,
      );
    }
    return { imageUrl };
  }

  /**
   * Fire-and-forget warm-up, called when a pet hatches or evolves so the
   * portrait is (usually) ready before anyone asks for it. Never throws.
   */
  async pregenerate(doc: PetDocument): Promise<void> {
    try {
      if (!doc.species || !doc.element || doc.stage === PetStage.EGG) return;
      if ((doc.images ?? {})[doc.stage]) return;
      await this.generateAndStore(doc);
    } catch (err) {
      this.logger.error(`pregenerate failed for pet ${doc._id}`, err as Error);
    }
  }

  private async generateAndStore(
    doc: PetDocument,
    force = false,
  ): Promise<string> {
    const unique = doc.stage !== PetStage.HATCHLING;
    const key = unique
      ? `pet_${doc._id.toString()}_${doc.stage}`
      : `pet_${doc.species}_${doc.element}_${doc.stage}`;

    let task = force ? undefined : this.inflight.get(key);
    if (!task) {
      task = this.generate(doc, key, unique, force);
      this.inflight.set(key, task);
      task.finally(() => this.inflight.delete(key)).catch(() => {});
    }
    let imageUrl = await task;

    if (force) {
      const existing = (doc.images ?? {})[doc.stage];
      // Generation failed (gradient fallback) — keep the real portrait.
      if (imageUrl.startsWith('data:') && existing) return existing;
      // Same key → same file name → same URL; a cache-buster makes the
      // browser (and React) actually swap the picture.
      if (!imageUrl.startsWith('data:')) {
        imageUrl = `${imageUrl}?v=${Date.now()}`;
      }
    }

    // Atomic $set — pregenerate and UI fetches may race on the same pet.
    await this.petModel
      .updateOne(
        { _id: doc._id },
        { $set: { [`images.${doc.stage}`]: imageUrl } },
      )
      .exec();
    return imageUrl;
  }

  private generate(
    doc: PetDocument,
    key: string,
    unique: boolean,
    force = false,
  ): Promise<string> {
    const species = getSpeciesDef(doc.species!);
    const element = ELEMENTS[doc.element!];

    const prompt =
      `Fantasy creature portrait for a mobile adventure game: a ${
        STAGE_PROMPT[doc.stage] ?? STAGE_PROMPT[PetStage.ADULT]
      } ${speciesEnglishHint(doc.species!)} as a ${
        ELEMENT_PROMPT[doc.element!]
      }.${unique ? this.soulFlavor(doc) : ''} Centered character portrait, ` +
      `painterly digital art, vibrant colors, soft magical background, ` +
      `cute yet epic, no text, no words, no letters.`;

    return this.replicate.generatePortrait(
      {
        key,
        prompt,
        emoji: species?.emoji ?? '🐾',
        colors: [element.color, '#1e293b'],
      },
      { force },
    );
  }

  /**
   * What makes THIS pet one of a kind: its lived quest history (soulXp),
   * the treasures it carries and the quirks of its soul.md.
   */
  private soulFlavor(doc: PetDocument): string {
    const parts: string[] = [];

    const dominant = Object.entries(doc.soulXp ?? {})
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);
    for (const [category] of dominant) {
      const trait = CATEGORY_TRAIT[category];
      if (trait) parts.push(trait);
    }

    const treasures = (doc.equipment ?? [])
      .map((id) => getTreasureItem(id)?.name)
      .filter((name): name is string => !!name);
    if (treasures.length > 0) {
      parts.push(`adorned with its magical treasures: ${treasures.join(', ')}`);
    }

    const quirks = extractQuirks(doc.soul ?? '');
    if (quirks) {
      parts.push(`its personality (German notes): "${quirks}"`);
    }

    if (parts.length === 0) return '';
    return ` This is a unique, one-of-a-kind individual shaped by its life with its human: ${parts.join(
      '; ',
    )}.`;
  }
}

/**
 * Pull the "## Eigenheiten" bullet points out of a pet's soul.md — the
 * lovable quirks the LLM gave it at hatch — trimmed for a prompt.
 */
export function extractQuirks(soul: string): string {
  const match = soul.match(/##\s*Eigenheiten([\s\S]*?)(?=\n#|$)/);
  if (!match) return '';
  const quirks = match[1]
    .split('\n')
    .map((line) => line.replace(/^[-*\s]+/, '').replace(/[*_`]/g, '').trim())
    .filter((line) => line.length > 0)
    .slice(0, 3)
    .join(', ');
  return quirks.slice(0, 220);
}

/**
 * The catalog speaks German; the image model understands English better.
 * Fall back to the raw id — close enough for most species.
 */
function speciesEnglishHint(speciesId: string): string {
  const map: Record<string, string> = {
    hund: 'dog',
    katze: 'cat',
    maus: 'mouse',
    kaninchen: 'rabbit',
    eichhoernchen: 'squirrel',
    igel: 'hedgehog',
    frosch: 'frog',
    ente: 'duck',
    taube: 'dove',
    huhn: 'chicken',
    fuchs: 'fox',
    wolf: 'wolf',
    eule: 'owl',
    waschbaer: 'raccoon',
    reh: 'deer',
    biber: 'beaver',
    rabe: 'raven',
    pinguin: 'penguin',
    koala: 'koala',
    fledermaus: 'bat',
    giraffe: 'giraffe',
    elefant: 'elephant',
    loewe: 'lion',
    tiger: 'tiger',
    panda: 'panda',
    kakadu: 'cockatoo',
    kiwi: 'kiwi bird',
    schildkroete: 'turtle',
    oktopus: 'octopus',
    pfau: 'peacock',
    chamaeleon: 'chameleon',
    flamingo: 'flamingo',
    narwal: 'narwhal',
    schneeleopard: 'snow leopard',
    mantarochen: 'manta ray',
    axolotl: 'axolotl',
    komodowaran: 'komodo dragon',
    drache: 'dragon',
    phoenix: 'phoenix',
    einhorn: 'unicorn',
    kraken: 'kraken',
    kitsune: 'kitsune fox spirit',
    greif: 'griffin',
  };
  return map[speciesId] ?? speciesId;
}
