import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Populates req.user when a valid token is present, but lets the request
 * through anonymously instead of rejecting when there is none.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(_err: any, user: TUser): TUser | null {
    return user || null;
  }
}
