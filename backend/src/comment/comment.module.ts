import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommentController } from './comment.controller.js';
import { CommentService } from './comment.service.js';
import { Comment, CommentSchema } from './schemas/comment.schema.js';
import { UserModule } from '../user/user.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }]),
    UserModule,
  ],
  controllers: [CommentController],
  providers: [CommentService],
})
export class CommentModule {}
