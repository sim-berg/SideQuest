import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ProfileComment,
  ProfileCommentDocument,
} from './schemas/profile-comment.schema.js';
import { UserService } from '../user/user.service.js';

function toPlain(doc: ProfileCommentDocument) {
  return {
    id: doc._id.toString(),
    profileUserId: doc.profileUserId,
    authorId: doc.authorId,
    authorName: doc.authorName,
    authorAvatarUrl: doc.authorAvatarUrl ?? null,
    body: doc.body,
    createdAt: doc.createdAt.toISOString(),
  };
}

@Injectable()
export class ProfileCommentService {
  constructor(
    @InjectModel(ProfileComment.name)
    private readonly model: Model<ProfileCommentDocument>,
    private readonly userService: UserService,
  ) {}

  async list(profileUserId: string, limit = 50) {
    const docs = await this.model
      .find({ profileUserId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
    return docs.map(toPlain);
  }

  async create(profileUserId: string, authorId: string, body: string) {
    const text = (body ?? '').trim();
    if (!text) throw new BadRequestException('Kommentar darf nicht leer sein');
    // 404s for an unknown profile rather than creating an orphan note.
    await this.userService.findById(profileUserId);

    const author = await this.userService.findById(authorId);
    const doc = await this.model.create({
      profileUserId,
      authorId,
      authorName: author.displayName || author.username,
      authorAvatarUrl: author.avatarUrl || null,
      body: text.slice(0, 500),
    });
    return toPlain(doc);
  }

  /** The author may delete their note; so may the owner of the wall. */
  async remove(id: string, userId: string) {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException('Kommentar nicht gefunden');
    if (doc.authorId !== userId && doc.profileUserId !== userId) {
      throw new ForbiddenException('Nicht dein Kommentar');
    }
    await doc.deleteOne();
    return { removed: true };
  }

  async count(profileUserId: string): Promise<number> {
    return this.model.countDocuments({ profileUserId }).exec();
  }
}
