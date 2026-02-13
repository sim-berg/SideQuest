import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { mockQuests } from './data/mock-quests.data.js';
import type { CreateQuestDto } from './dto/create-quest.dto.js';
import type { QuestFilterDto } from './dto/quest-filter.dto.js';
import type { Quest } from './interfaces/quest.interface.js';
import { GeoService } from '../geo/geo.service.js';

@Injectable()
export class QuestService {
  private quests: Quest[] = [...mockQuests];

  constructor(private readonly geoService: GeoService) {}

  findAll(filter: QuestFilterDto): Quest[] {
    let result = [...this.quests];

    if (filter.categories?.length) {
      result = result.filter((q) => filter.categories!.includes(q.category));
    }
    if (filter.paidOnly) {
      result = result.filter((q) => q.reward != null && q.reward > 0);
    }
    if (filter.timedOnly) {
      result = result.filter((q) => q.timeLimit != null);
    }
    if (filter.lat != null && filter.lng != null && filter.radius) {
      result = result.filter(
        (q) =>
          this.geoService.haversine(filter.lat!, filter.lng!, q.lat, q.lng) <=
          filter.radius!,
      );
    }

    return result;
  }

  findOne(id: string): Quest {
    const quest = this.quests.find((q) => q.id === id);
    if (!quest) throw new NotFoundException(`Quest ${id} not found`);
    return quest;
  }

  create(dto: CreateQuestDto): Quest {
    const quest: Quest = {
      id: uuid(),
      ...dto,
      createdAt: new Date().toISOString(),
    };
    this.quests.push(quest);
    return quest;
  }
}
