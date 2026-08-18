import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Friendship, FriendshipDocument } from './schemas/friendship.schema.js';
import { UserService } from '../user/user.service.js';

/** How the viewing user stands towards another user. */
export type FriendshipRelation =
  | 'none'
  | 'friends'
  | 'request_sent'
  | 'request_received'
  | 'declined';

export interface RelationView {
  relation: FriendshipRelation;
  /** Id of the underlying request, when there is one to act on. */
  requestId: string | null;
  since: string | null;
}

@Injectable()
export class FriendshipService {
  constructor(
    @InjectModel(Friendship.name)
    private readonly friendshipModel: Model<FriendshipDocument>,
    private readonly userService: UserService,
  ) {}

  /** The bond between two users regardless of who asked first. */
  private async findBond(
    a: string,
    b: string,
  ): Promise<FriendshipDocument | null> {
    return this.friendshipModel
      .findOne({
        $or: [
          { requesterId: a, addresseeId: b },
          { requesterId: b, addresseeId: a },
        ],
      })
      .exec();
  }

  /**
   * Send a Kumpanen request. If the other person already asked us, this
   * accepts their request instead of stacking a mirror-image one.
   */
  async request(requesterId: string, addresseeId: string, message = '') {
    if (requesterId === addresseeId) {
      throw new BadRequestException('Du kannst dir nicht selbst folgen');
    }
    // 404s if the target doesn't exist, so we never store a dangling bond.
    await this.userService.findById(addresseeId);

    const existing = await this.findBond(requesterId, addresseeId);
    if (existing) {
      if (existing.status === 'accepted') {
        return { status: 'accepted' as const, id: existing._id.toString() };
      }
      // They asked us first — saying "add me too" means yes.
      if (
        existing.status === 'pending' &&
        existing.addresseeId === requesterId
      ) {
        return this.accept(existing._id.toString(), requesterId);
      }
      if (existing.status === 'pending') {
        return { status: 'pending' as const, id: existing._id.toString() };
      }
      // A previously declined bond can be tried again.
      existing.requesterId = requesterId;
      existing.addresseeId = addresseeId;
      existing.status = 'pending';
      existing.message = message.slice(0, 200);
      existing.respondedAt = null;
      await existing.save();
      return { status: 'pending' as const, id: existing._id.toString() };
    }

    const doc = await this.friendshipModel.create({
      requesterId,
      addresseeId,
      status: 'pending',
      message: message.slice(0, 200),
    });
    return { status: 'pending' as const, id: doc._id.toString() };
  }

  async accept(requestId: string, userId: string) {
    const doc = await this.friendshipModel.findById(requestId).exec();
    if (!doc) throw new NotFoundException('Anfrage nicht gefunden');
    // Only the person who was asked may accept.
    if (doc.addresseeId !== userId) {
      throw new BadRequestException('Diese Anfrage gehört dir nicht');
    }
    doc.status = 'accepted';
    doc.respondedAt = new Date();
    await doc.save();
    return { status: 'accepted' as const, id: doc._id.toString() };
  }

  async decline(requestId: string, userId: string) {
    const doc = await this.friendshipModel.findById(requestId).exec();
    if (!doc) throw new NotFoundException('Anfrage nicht gefunden');
    if (doc.addresseeId !== userId) {
      throw new BadRequestException('Diese Anfrage gehört dir nicht');
    }
    doc.status = 'declined';
    doc.respondedAt = new Date();
    await doc.save();
    return { status: 'declined' as const, id: doc._id.toString() };
  }

  /** Withdraw a request you sent, or end an existing friendship. */
  async remove(userId: string, otherId: string) {
    const doc = await this.findBond(userId, otherId);
    if (!doc) return { removed: false };
    await doc.deleteOne();
    return { removed: true };
  }

  /** Accepted Kumpane of a user, as profile cards. */
  async listFriends(userId: string) {
    const bonds = await this.friendshipModel
      .find({
        status: 'accepted',
        $or: [{ requesterId: userId }, { addresseeId: userId }],
      })
      .sort({ updatedAt: -1 })
      .exec();

    const ids = bonds.map((b) =>
      b.requesterId === userId ? b.addresseeId : b.requesterId,
    );
    const cards = await this.userService.getCards(ids);
    const since = new Map(
      bonds.map((b) => [
        b.requesterId === userId ? b.addresseeId : b.requesterId,
        (b.respondedAt ?? b.updatedAt).toISOString(),
      ]),
    );
    // Keep the bond ordering (most recent first) rather than Mongo's.
    return ids
      .map((id) => {
        const card = cards.find((c) => c.id === id);
        return card ? { ...card, friendsSince: since.get(id) ?? null } : null;
      })
      .filter(Boolean);
  }

  /** Requests waiting for this user to answer. */
  async listIncoming(userId: string) {
    const bonds = await this.friendshipModel
      .find({ addresseeId: userId, status: 'pending' })
      .sort({ createdAt: -1 })
      .exec();
    return this.withCards(bonds, (b) => b.requesterId);
  }

  /** Requests this user sent that are still unanswered. */
  async listOutgoing(userId: string) {
    const bonds = await this.friendshipModel
      .find({ requesterId: userId, status: 'pending' })
      .sort({ createdAt: -1 })
      .exec();
    return this.withCards(bonds, (b) => b.addresseeId);
  }

  private async withCards(
    bonds: FriendshipDocument[],
    pick: (b: FriendshipDocument) => string,
  ) {
    const cards = await this.userService.getCards(bonds.map(pick));
    const byId = new Map(cards.map((c) => [c.id, c]));
    return bonds
      .map((b) => {
        const user = byId.get(pick(b));
        if (!user) return null;
        return {
          id: b._id.toString(),
          user,
          message: b.message ?? '',
          createdAt: b.createdAt.toISOString(),
        };
      })
      .filter(Boolean);
  }

  async countPendingIncoming(userId: string): Promise<number> {
    return this.friendshipModel
      .countDocuments({ addresseeId: userId, status: 'pending' })
      .exec();
  }

  /** How `userId` stands towards `otherId` — drives the profile button. */
  async relationTo(userId: string, otherId: string): Promise<RelationView> {
    if (userId === otherId) {
      return { relation: 'none', requestId: null, since: null };
    }
    const bond = await this.findBond(userId, otherId);
    if (!bond) return { relation: 'none', requestId: null, since: null };

    const id = bond._id.toString();
    if (bond.status === 'accepted') {
      return {
        relation: 'friends',
        requestId: id,
        since: (bond.respondedAt ?? bond.updatedAt).toISOString(),
      };
    }
    if (bond.status === 'declined') {
      return { relation: 'declined', requestId: id, since: null };
    }
    return {
      relation:
        bond.requesterId === userId ? 'request_sent' : 'request_received',
      requestId: id,
      since: bond.createdAt.toISOString(),
    };
  }

  /** Number of accepted Kumpane — shown as a profile stat. */
  async countFriends(userId: string): Promise<number> {
    return this.friendshipModel
      .countDocuments({
        status: 'accepted',
        $or: [{ requesterId: userId }, { addresseeId: userId }],
      })
      .exec();
  }
}
