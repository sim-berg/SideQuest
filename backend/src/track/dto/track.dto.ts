import {
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Metric, ProgressSource, TrackKind } from '../enums/track.enums.js';

/** GET /api/tracks — pool filters. */
export class TrackPoolQueryDto {
  @IsOptional()
  @IsEnum(TrackKind)
  kind?: TrackKind;

  @IsOptional()
  @IsString()
  tag?: string;
}

/**
 * POST /api/tracks/progress — report that something happened.
 *
 * The client never names a track: it reports a fact ("ich war heute rauchfrei")
 * and the engine decides which enrollments that moves. Keeping the two apart is
 * what lets one action feed several challenges at once.
 */
export class EmitProgressDto {
  @IsEnum(Metric)
  metric: Metric;

  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @IsOptional()
  @IsEnum(ProgressSource)
  source?: ProgressSource;

  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;

  /** Stable key so a double tap or a retry counts once. */
  @IsOptional()
  @IsString()
  dedupeKey?: string;

  /**
   * Minutes the user's local time differs from UTC
   * (`new Date().getTimezoneOffset()`), so streak days line up with their
   * actual midnight rather than UTC's.
   */
  @IsOptional()
  @IsInt()
  @Min(-840)
  @Max(840)
  tzOffsetMinutes?: number;
}

/** GET /api/tracks/history */
export class ProgressHistoryQueryDto {
  @IsOptional()
  @IsEnum(Metric)
  metric?: Metric;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
