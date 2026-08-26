import { Injectable } from '@nestjs/common';
import { BonusTrigger } from './enums/track.enums.js';
import type { BonusRule } from './schemas/track.schema.js';
import { isWeekend } from './day-key.util.js';

/** What a bonus rule gets to look at when it decides whether it applies. */
export interface BonusContext {
  /** Value of the single progress event that just landed. */
  eventValue: number;
  /** Local hour (0–23) the event occurred at. */
  hour: number;
  dayKey: string;
  /** Current streak of the objective that just advanced. */
  streak: number;
  /** Free-form event context (tempC, companionId …). */
  meta: Record<string, unknown>;
  /** Whole track finished with this event. */
  trackCompleted: boolean;
  /** Every optional objective is also done. */
  perfectRun: boolean;
  /** Days left before the deadline, null when open-ended. */
  daysEarly: number | null;
}

export interface AppliedBonus {
  id: string;
  label: string;
  xp: number;
}

/**
 * Evaluates the declarative bonus rules of a track.
 *
 * Rules live in the catalog as data, so this service is the only place that
 * knows what a trigger *means* — adding a bonus to a challenge never touches
 * code, and adding a new kind of trigger touches exactly one switch.
 */
@Injectable()
export class BonusService {
  /**
   * Returns every bonus that fires for this event, along with the total XP
   * they add on top of `baseXp`.
   */
  apply(
    rules: BonusRule[],
    baseXp: number,
    ctx: BonusContext,
  ): { bonusXp: number; applied: AppliedBonus[] } {
    const applied: AppliedBonus[] = [];
    let bonusXp = 0;

    for (const rule of rules) {
      if (!this.matches(rule, ctx)) continue;

      // A multiplier scales the objective's own XP; flatXp is added as-is.
      const fromMultiplier =
        rule.multiplier > 1 ? Math.round(baseXp * (rule.multiplier - 1)) : 0;
      const xp = fromMultiplier + rule.flatXp;
      if (xp <= 0) continue;

      bonusXp += xp;
      applied.push({ id: rule.id, label: rule.label, xp });
    }

    return { bonusXp, applied };
  }

  private matches(rule: BonusRule, ctx: BonusContext): boolean {
    switch (rule.trigger) {
      case BonusTrigger.BEFORE_HOUR:
        return ctx.hour < rule.value;

      case BonusTrigger.AFTER_HOUR:
        return ctx.hour >= rule.value;

      case BonusTrigger.WEEKEND:
        return isWeekend(ctx.dayKey);

      case BonusTrigger.STREAK_AT_LEAST:
        return ctx.streak >= rule.value;

      case BonusTrigger.VALUE_AT_LEAST:
        return ctx.eventValue >= rule.value;

      case BonusTrigger.COLD_WEATHER: {
        const temp = ctx.meta.tempC;
        return typeof temp === 'number' && temp <= rule.value;
      }

      case BonusTrigger.WITH_COMPANION:
        return typeof ctx.meta.companionId === 'string';

      // The two below only make sense at the finish line.
      case BonusTrigger.PERFECT_RUN:
        return ctx.trackCompleted && ctx.perfectRun;

      case BonusTrigger.AHEAD_OF_SCHEDULE:
        return (
          ctx.trackCompleted &&
          ctx.daysEarly !== null &&
          ctx.daysEarly >= rule.value
        );

      default:
        return false;
    }
  }
}
