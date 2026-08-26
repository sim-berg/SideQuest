import { IsString, MaxLength } from 'class-validator';

/** Scanned (or typed) QR payload of a world quest. */
export class RedeemQrDto {
  @IsString()
  @MaxLength(200)
  code: string;
}
