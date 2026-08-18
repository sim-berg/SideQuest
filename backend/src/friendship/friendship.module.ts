import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Friendship, FriendshipSchema } from './schemas/friendship.schema.js';
import { FriendshipService } from './friendship.service.js';
import { FriendshipController } from './friendship.controller.js';
import { UserModule } from '../user/user.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Friendship.name, schema: FriendshipSchema },
    ]),
    UserModule,
  ],
  controllers: [FriendshipController],
  providers: [FriendshipService],
  exports: [FriendshipService],
})
export class FriendshipModule {}
