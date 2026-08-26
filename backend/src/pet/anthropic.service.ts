import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Thin wrapper around the Anthropic SDK for the pet brain (souls, chat,
 * personalized quests). Without ANTHROPIC_API_KEY every call returns null and
 * callers fall back to templates/canned copy — the app never depends on the
 * LLM being available.
 */
@Injectable()
export class AnthropicService {
  private readonly logger = new Logger(AnthropicService.name);
  private readonly client: Anthropic | null;
  private readonly model: string;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('ANTHROPIC_API_KEY');
    this.client = apiKey ? new Anthropic({ apiKey }) : null;
    this.model = config.get<string>('ANTHROPIC_MODEL') || 'claude-opus-5';
    if (!this.client) {
      this.logger.warn(
        'ANTHROPIC_API_KEY not set — pet souls, chat and personalized dailies fall back to templates',
      );
    }
  }

  get hasKey(): boolean {
    return this.client !== null;
  }

  /**
   * Free-form text generation. `cacheSystem` marks the system prompt as a
   * cache breakpoint (useful for chat, where the soul-based system prompt is
   * stable across turns).
   */
  async generateText(opts: {
    system: string;
    messages: ChatTurn[];
    maxTokens?: number;
    effort?: 'low' | 'medium' | 'high';
    cacheSystem?: boolean;
  }): Promise<string | null> {
    if (!this.client) return null;
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: opts.maxTokens ?? 16000,
        system: opts.cacheSystem
          ? [
              {
                type: 'text' as const,
                text: opts.system,
                cache_control: { type: 'ephemeral' as const },
              },
            ]
          : opts.system,
        messages: opts.messages,
        ...(opts.effort ? { output_config: { effort: opts.effort } } : {}),
      });
      if (response.stop_reason === 'refusal') return null;
      const text = response.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('');
      return text.trim() || null;
    } catch (err) {
      this.logger.error('generateText failed', err as Error);
      return null;
    }
  }

  /**
   * Schema-constrained JSON generation via structured outputs. Returns the
   * parsed object or null on refusal/parse failure.
   */
  async generateJson<T>(opts: {
    system: string;
    prompt: string;
    schema: Record<string, unknown>;
    maxTokens?: number;
  }): Promise<T | null> {
    if (!this.client) return null;
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: opts.maxTokens ?? 16000,
        system: opts.system,
        messages: [{ role: 'user', content: opts.prompt }],
        output_config: {
          format: {
            type: 'json_schema',
            schema: opts.schema,
          },
        },
      } as Anthropic.MessageCreateParamsNonStreaming);
      if (response.stop_reason === 'refusal') return null;
      const text = response.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('');
      return JSON.parse(text) as T;
    } catch (err) {
      this.logger.error('generateJson failed', err as Error);
      return null;
    }
  }
}
