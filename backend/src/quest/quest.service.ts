import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Quest, QuestDocument } from './schemas/quest.schema.js';
import type { CreateQuestDto } from './dto/create-quest.dto.js';
import type { QuestFilterDto } from './dto/quest-filter.dto.js';
import { GeoService } from '../geo/geo.service.js';

function toPlain(doc: QuestDocument) {
  const obj = doc.toObject();
  return {
    id: obj._id.toString(),
    title: obj.title,
    description: obj.description,
    lat: obj.lat,
    lng: obj.lng,
    address: obj.address,
    category: obj.category,
    questGiver: obj.questGiver,
    reward: obj.reward,
    timeLimit: obj.timeLimit,
    createdAt: obj.createdAt?.toISOString?.() ?? obj.createdAt,
  };
}

@Injectable()
export class QuestService {
  constructor(
    @InjectModel(Quest.name) private questModel: Model<QuestDocument>,
    private readonly geoService: GeoService,
  ) {}

  async findAll(filter: QuestFilterDto) {
    const query: Record<string, unknown> = {};

    if (filter.categories?.length) {
      query.category = { $in: filter.categories };
    }
    if (filter.paidOnly) {
      query.reward = { $gt: 0 };
    }
    if (filter.timedOnly) {
      query.timeLimit = { $ne: null };
    }

    let docs = await this.questModel.find(query).sort({ createdAt: -1 }).exec();

    // Geo filter in-app (haversine) since we don't use a geo index
    if (filter.lat != null && filter.lng != null && filter.radius) {
      docs = docs.filter(
        (q) =>
          this.geoService.haversine(filter.lat!, filter.lng!, q.lat, q.lng) <=
          filter.radius!,
      );
    }

    return docs.map(toPlain);
  }

  async findOne(id: string) {
    const doc = await this.questModel.findById(id).exec();
    if (!doc) throw new NotFoundException(`Quest ${id} not found`);
    return toPlain(doc);
  }

  async create(dto: CreateQuestDto) {
    const doc = await this.questModel.create(dto);
    return toPlain(doc);
  }
}
