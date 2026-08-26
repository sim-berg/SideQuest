import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment, CommentDocument } from './schemas/comment.schema.js';
import { UserService } from '../user/user.service.js';

function toPlain(doc: CommentDocument) {
  const obj = doc.toObject();
  return {
    id: obj._id.toString(),
    questId: obj.questId,
    userId: obj.userId,
    username: obj.username,
    avatarUrl: obj.avatarUrl ?? null,
    body: obj.body ?? '',
    imageUrl: obj.imageUrl ?? null,
    createdAt: obj.createdAt?.toISOString?.() ?? obj.createdAt,
  };
}

@Injectable()
export class CommentService {
  private readonly appUrl: string;

  constructor(
    @InjectModel(Comment.name)
    private readonly commentModel: Model<CommentDocument>,
    private readonly userService: UserService,
    config: ConfigService,
  ) {
    this.appUrl = config
      .get<string>('APP_URL', 'http://localhost:5173')
      .replace(/\/$/, '');
  }

  async list(questId: string) {
    const docs = await this.commentModel
      .find({ questId })
      .sort({ createdAt: 1 })
      .exec();
    return docs.map(toPlain);
  }

  async listByUser(userId: string, limit = 10) {
    const docs = await this.commentModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
    return docs.map(toPlain);
  }

  async create(
    questId: string,
    userId: string,
    body: string,
    imageFilename: string | null,
  ) {
    const text = (body ?? '').trim();
    if (!text && !imageFilename) {
      throw new BadRequestException('Comment needs text or an image');
    }

    let username = '';
    let avatarUrl: string | null = null;
    try {
      const user = await this.userService.findById(userId);
      username = user.displayName || user.username;
      avatarUrl = user.avatarUrl || null;
    } catch {
      // user lookup failed — keep blanks
    }

    const imageUrl = imageFilename
      ? `${this.appUrl}/uploads/comments/${imageFilename}`
      : null;

    const doc = await this.commentModel.create({
      questId,
      userId,
      username,
      avatarUrl,
      body: text,
      imageUrl,
    });
    return toPlain(doc);
  }
}
