import { IsNumber, Min, Max } from 'class-validator';

/** Presence heartbeat from inside (hopefully) the event area. */
export class EventCheckinDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}
