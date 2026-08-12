import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AnthropicService, ChatTurn } from './anthropic.service.js';
import { SoulService } from './soul.service.js';
import { PetService } from './pet.service.js';
import {
  PetMessage,
  PetMessageDocument,
} from './schemas/pet-message.schema.js';
import { PetDocument } from './schemas/pet.schema.js';
import { ELEMENTS, getSpeciesDef } from './pet-catalog.js';
import { Element } from './enums/element.enum.js';

const HISTORY_TURNS = 20;

/** Canned replies when no LLM is configured — the pet stays "alive". */
const FALLBACK_REPLIES = [
  'schnuppert neugierig an dir und wedelt aufgeregt.',
  'stupst dich sanft an: Zeit für eine neue Quest?',
  'rollt sich zufrieden neben dir zusammen.',
  'blickt dich mit funkelnden Augen an und schnattert etwas Unverständliches.',
  'zeigt stolz auf dein Logbuch. Es scheint an deine Dailys zu erinnern.',
];

const EGG_REPLIES = [
  'Aus dem Ei kommt ein leises, rhythmisches Klopfen …',
  'Das Ei wackelt kurz und wird dann wieder still.',
  'Du spürst eine warme Schwingung aus dem Inneren des Eis.',
];

function toPlainMessage(doc: PetMessageDocument) {
  const obj = doc.toObject();
  return {
    id: obj._id.toString(),
    petId: obj.petId,
    role: obj.role,
    content: obj.content,
    createdAt: obj.createdAt?.toISOString?.() ?? obj.createdAt,
  };
}

@Injectable()
export class PetChatService {
  constructor(
    private readonly anthropic: AnthropicService,
    private readonly soulService: SoulService,
    private readonly petService: PetService,
    @InjectModel(PetMessage.name)
    private messageModel: Model<PetMessageDocument>,
  ) {}

  /** Chat history with the active pet, oldest first. */
  async getHistory(userId: string) {
    const pet = await this.petService.getActive(userId);
    if (!pet) return [];
    const docs = await this.messageModel
      .find({ petId: pet._id.toString() })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
    return docs.reverse().map(toPlainMessage);
  }

  async chat(userId: string, message: string) {
    const text = (message ?? '').trim();
    if (!text || text.length > 500) {
      throw new BadRequestException('Nachricht muss 1-500 Zeichen lang sein');
    }
    const pet = await this.petService.getActive(userId);
    if (!pet) throw new BadRequestException('Kein aktiver Gefährte');
    const petId = pet._id.toString();

    await this.messageModel.create({ userId, petId, role: 'user', content: text });

    const replyText = pet.species
      ? await this.generateReply(userId, pet, text)
      : EGG_REPLIES[Math.floor(Math.random() * EGG_REPLIES.length)];

    const replyDoc = await this.messageModel.create({
      userId,
      petId,
      role: 'pet',
      content: replyText,
    });
    return { reply: toPlainMessage(replyDoc) };
  }

  private async generateReply(
    userId: string,
    pet: PetDocument,
    latestMessage: string,
  ): Promise<string> {
    const species = getSpeciesDef(pet.species!);
    const element = ELEMENTS[pet.element as Element];

    const history = await this.messageModel
      .find({ petId: pet._id.toString() })
      .sort({ createdAt: -1 })
      .limit(HISTORY_TURNS)
      .exec();

    // Oldest first; the newest user message is already persisted and thus
    // included at the end of the history.
    const turns: ChatTurn[] = history
      .reverse()
      .map((m) => ({
        role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.content,
      }));
    if (turns.length === 0 || turns[turns.length - 1].role !== 'user') {
      turns.push({ role: 'user', content: latestMessage });
    }

    const userSoul = await this.soulService.getUserSoulContent(userId);
    const system = [
      `Du BIST ${pet.name || `ein ${element?.name}-${species?.name}`} — das ${element?.name}-${species?.name} ${species?.emoji ?? ''} deines Menschen in der Abenteuer-App SideQuest. Du bist sein persönlicher Begleiter und Quest-Gefährte.`,
      '',
      'Deine Seele:',
      pet.soul || '(noch unbeschrieben — frisch geschlüpft und neugierig)',
      '',
      userSoul ? `Was du über deinen Menschen weißt:\n${userSoul}` : '',
      '',
      'Regeln:',
      '- Antworte auf Deutsch, in 1-3 kurzen Sätzen, immer in deiner Rolle.',
      '- Du bist ein Tier mit Charakter: verspielt, treu, deinem Element entsprechend gefärbt.',
      '- Ermutige sanft zu Daily-Quests, Spaziergängen und Abenteuern, ohne aufdringlich zu sein.',
      '- Keine Meta-Kommentare über KI, Prompts oder die App-Technik.',
    ]
      .filter((line) => line !== '')
      .join('\n');

    const reply = await this.anthropic.generateText({
      system,
      messages: turns,
      maxTokens: 2048,
      effort: 'low',
      cacheSystem: true,
    });

    if (reply) return reply;
    const fallback =
      FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)];
    return `${species?.emoji ?? '🐾'} ${pet.name || species?.name} ${fallback}`;
  }
}
