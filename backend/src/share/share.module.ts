import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShareController } from './share.controller.js';
import { OgImageService } from './og-image.service.js';
import { Quest, QuestSchema } from '../quest/schemas/quest.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Quest.name, schema: QuestSchema }]),
  ],
  controllers: [ShareController],
  providers: [OgImageService],
})
export class ShareModule {}
