import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ProfileComment,
  ProfileCommentSchema,
} from './schemas/profile-comment.schema.js';
import { ProfileCommentService } from './profile-comment.service.js';
import { ProfileCommentController } from './profile-comment.controller.js';
import { UserModule } from '../user/user.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProfileComment.name, schema: ProfileCommentSchema },
    ]),
    UserModule,
  ],
  controllers: [ProfileCommentController],
  providers: [ProfileCommentService],
  exports: [ProfileCommentService],
})
export class ProfileCommentModule {}
