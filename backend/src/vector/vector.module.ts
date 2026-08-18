import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Quest, QuestSchema } from '../quest/schemas/quest.schema.js';
import {
  EmbeddingCache,
  EmbeddingCacheSchema,
} from './schemas/embedding-cache.schema.js';
import { QdrantService } from './qdrant.service.js';
import { EmbeddingService } from './embedding.service.js';
import { QuestVectorService } from './quest-vector.service.js';

/**
 * Embedding + vector search layer. Self-contained: it owns the reconciler that
 * mirrors quests into Qdrant, so importing it is enough to keep the index in
 * sync — no scheduling setup at the call site.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Quest.name, schema: QuestSchema },
      { name: EmbeddingCache.name, schema: EmbeddingCacheSchema },
    ]),
  ],
  providers: [QdrantService, EmbeddingService, QuestVectorService],
  exports: [QuestVectorService, EmbeddingService, QdrantService],
})
export class VectorModule {}
