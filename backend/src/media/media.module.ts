import { Global, Module } from '@nestjs/common';
import { ImageService } from './image.service.js';

/**
 * Prompt-to-image generation, shared by every feature that needs generated
 * art (emblems today; scenes, portraits and avatars next). Global so callers
 * don't have to thread the import through their own module graph.
 */
@Global()
@Module({
  providers: [ImageService],
  exports: [ImageService],
})
export class MediaModule {}
