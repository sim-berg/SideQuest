import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { CommentService } from './comment.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

const COMMENT_UPLOAD_DIR = join(process.cwd(), 'uploads', 'comments');

const imageStorage = diskStorage({
  destination: (_req, _file, cb) => {
    if (!existsSync(COMMENT_UPLOAD_DIR)) {
      mkdirSync(COMMENT_UPLOAD_DIR, { recursive: true });
    }
    cb(null, COMMENT_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${extname(file.originalname).toLowerCase() || '.jpg'}`);
  },
});

@Controller('sidequests/:questId/comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  list(@Param('questId') questId: string) {
    return this.commentService.list(questId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: imageStorage,
      limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
      fileFilter: (_req, file, cb) =>
        cb(null, file.mimetype.startsWith('image/')),
    }),
  )
  create(
    @Param('questId') questId: string,
    @Request() req: any,
    @Body('body') body: string,
    @UploadedFile() image?: { filename?: string },
  ) {
    return this.commentService.create(
      questId,
      req.user.userId,
      body ?? '',
      image?.filename ?? null,
    );
  }
}
