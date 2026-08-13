import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Pet, PetDocument } from './schemas/pet.schema.js';
import { PetStage } from './enums/pet-stage.enum.js';
import { Element } from './enums/element.enum.js';
import { ELEMENTS, getSpeciesDef } from './pet-catalog.js';
import { ReplicateService } from '../achievement/replicate.service.js';

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
 * Lazily generates the visual identity of a pet: one portrait per
 * (species, element, stage) combination, generated via Replicate and shared
 * across all pets of that combination — consistent looks, one-time cost.
 * The resulting URL is also stored on the pet (`images[stage]`).
 */
@Injectable()
export class PetImageService {
  constructor(
    @InjectModel(Pet.name) private petModel: Model<PetDocument>,
    private readonly replicate: ReplicateService,
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

    const imageUrl = await this.generate(doc);
    doc.images = { ...(doc.images ?? {}), [doc.stage]: imageUrl };
    doc.markModified('images');
    await doc.save();
    return { imageUrl };
  }

  private async generate(doc: PetDocument): Promise<string> {
    const species = getSpeciesDef(doc.species!);
    const element = ELEMENTS[doc.element!];
    const key = `pet_${doc.species}_${doc.element}_${doc.stage}`;

    const prompt =
      `Fantasy creature portrait for a mobile adventure game: a ${
        STAGE_PROMPT[doc.stage] ?? STAGE_PROMPT[PetStage.ADULT]
      } ${speciesEnglishHint(doc.species!)} as a ${
        ELEMENT_PROMPT[doc.element!]
      }. Centered character portrait, painterly digital art, vibrant colors, ` +
      `soft magical background, cute yet epic, no text, no words, no letters.`;

    return this.replicate.generatePortrait({
      key,
      prompt,
      emoji: species?.emoji ?? '🐾',
      colors: [element.color, '#1e293b'],
    });
  }
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
