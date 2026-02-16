import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema.js';
import { MessageGateway } from './message.gateway.js';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private readonly messageGateway: MessageGateway,
  ) {}

  /**
   * Return every conversation the user participates in.
   *
   * Each entry contains:
   *  - user:         public profile of the *other* participant
   *  - lastMessage:  most recent message in the conversation
   *  - unreadCount:  number of unread messages sent TO the caller
   */
  async getConversations(userId: string) {
    const uid = new Types.ObjectId(userId);

    const conversations = await this.messageModel.aggregate([
      // 1. All messages involving this user
      {
        $match: {
          $or: [{ senderId: uid }, { recipientId: uid }],
        },
      },

      // 2. Sort so $first in the group gives the latest message
      { $sort: { createdAt: -1 } },

      // 3. Compute the "other" user id
      {
        $addFields: {
          otherUserId: {
            $cond: {
              if: { $eq: ['$senderId', uid] },
              then: '$recipientId',
              else: '$senderId',
            },
          },
        },
      },

      // 4. Group by conversation partner
      {
        $group: {
          _id: '$otherUserId',
          lastMessage: {
            $first: {
              body: '$body',
              createdAt: '$createdAt',
              senderId: '$senderId',
            },
          },
          unreadCount: {
            $sum: {
              $cond: {
                if: {
                  $and: [
                    { $eq: ['$recipientId', uid] },
                    { $eq: ['$read', false] },
                  ],
                },
                then: 1,
                else: 0,
              },
            },
          },
        },
      },

      // 5. Most recent conversations first
      { $sort: { 'lastMessage.createdAt': -1 } },

      // 6. Lookup user profile for the other participant
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: '$userInfo' },

      // 7. Shape the final output
      {
        $project: {
          _id: 0,
          user: {
            id: '$userInfo._id',
            username: '$userInfo.username',
            displayName: '$userInfo.displayName',
            avatarUrl: '$userInfo.avatarUrl',
            isOnline: '$userInfo.isOnline',
          },
          lastMessage: 1,
          unreadCount: 1,
        },
      },
    ]);

    return conversations;
  }

  /**
   * Paginated message history between the authenticated user and another user.
   * Returns messages sorted newest-first with cursor-based pagination.
   */
  async getMessages(
    userId: string,
    otherUserId: string,
    before?: string,
    limit = 50,
  ) {
    const uid = new Types.ObjectId(userId);
    const otherId = new Types.ObjectId(otherUserId);

    const filter: Record<string, any> = {
      $or: [
        { senderId: uid, recipientId: otherId },
        { senderId: otherId, recipientId: uid },
      ],
    };

    if (before) {
      filter._id = { $lt: new Types.ObjectId(before) };
    }

    const messages = await this.messageModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    return messages;
  }

  /**
   * Persist a new message, then push it to the recipient in real time.
   */
  async sendMessage(senderId: string, recipientId: string, body: string) {
    const message = await this.messageModel.create({
      senderId: new Types.ObjectId(senderId),
      recipientId: new Types.ObjectId(recipientId),
      body,
    });

    this.messageGateway.sendToUser(recipientId, 'message:new', {
      _id: message._id,
      senderId: message.senderId,
      recipientId: message.recipientId,
      body: message.body,
      read: message.read,
      createdAt: (message as any).createdAt,
    });

    return message;
  }

  /**
   * Mark every unread message from `fromUserId` to `userId` as read and emit
   * a read-receipt event back to the sender.
   */
  async markAsRead(userId: string, fromUserId: string) {
    const now = new Date();

    const result = await this.messageModel.updateMany(
      {
        senderId: new Types.ObjectId(fromUserId),
        recipientId: new Types.ObjectId(userId),
        read: false,
      },
      {
        $set: { read: true, readAt: now },
      },
    );

    if (result.modifiedCount > 0) {
      this.messageGateway.sendToUser(fromUserId, 'message:read', {
        readBy: userId,
        readAt: now.toISOString(),
      });
    }

    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Total number of unread messages addressed to this user across all
   * conversations.
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.messageModel.countDocuments({
      recipientId: new Types.ObjectId(userId),
      read: false,
    });
  }
}
