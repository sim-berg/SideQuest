import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GeoService } from '../geo/geo.service.js';
import { Rarity } from './enums/rarity.enum.js';
import { TREASURE_CATALOG } from './treasure-catalog.js';
import {
  TreasureSpawn,
  TreasureSpawnDocument,
} from './schemas/treasure-spawn.schema.js';

/**
 * Background worker that drops treasure chests on the map on a timer.
 *
 * Player positions never persist: the nearby endpoint registers an ephemeral
 * "beacon" (grid-rounded location + last-seen). Every tick the worker prunes
 * stale beacons, despawns expired chests, and trickles new chests into the
 * area around each active beacon — random item (rarity-weighted), random
 * position, rarity-dependent TTL (the rarer the chest, the shorter it stays).
 */
@Injectable()
export class TreasureSpawnerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TreasureSpawnerService.name);

  /** Ephemeral activity beacons, keyed by ~1km grid cell. Never persisted. */
  private readonly beacons = new Map<
    string,
    { lat: number; lng: number; lastSeen: number }
  >();

  private tickInterval: NodeJS.Timeout;

  static readonly SPAWN_RADIUS_KM = 1.2;
  private readonly TICK_MS = 45_000;
  private readonly BEACON_TTL_MS = 10 * 60_000;
  private readonly MIN_OFFSET_KM = 0.1;
  private readonly TARGET_ACTIVE = 5;
  private readonly MAX_SPAWNS_PER_TICK = 2;
  private readonly COLLECTED_KEEP_MS = 24 * 3600_000;
  private readonly EARTH_RADIUS_KM = 6371;

  /** Spawn weights — how often each rarity drops. */
  private readonly RARITY_WEIGHTS: Record<Rarity, number> = {
    [Rarity.BASIC]: 55,
    [Rarity.UNCOMMON]: 25,
    [Rarity.RARE]: 12,
    [Rarity.EPIC]: 6,
    [Rarity.LEGENDARY]: 2,
  };

  /** Rarer chests vanish faster — grab them while you can. */
  private readonly TTL_MINUTES: Record<Rarity, number> = {
    [Rarity.BASIC]: 45,
    [Rarity.UNCOMMON]: 35,
    [Rarity.RARE]: 25,
    [Rarity.EPIC]: 18,
    [Rarity.LEGENDARY]: 12,
  };

  constructor(
    @InjectModel(TreasureSpawn.name)
    private readonly spawnModel: Model<TreasureSpawnDocument>,
    private readonly geoService: GeoService,
  ) {}

  onModuleInit() {
    this.tickInterval = setInterval(() => void this.tick(), this.TICK_MS);
  }

  onModuleDestroy() {
    clearInterval(this.tickInterval);
  }

  /**
   * Mark an area as active. Called whenever a client polls for nearby
   * treasures. A brand-new area gets an immediate top-up so first-time
   * visitors don't stare at an empty map until the next tick.
   */
  registerBeacon(lat: number, lng: number) {
    const key = `${lat.toFixed(2)}:${lng.toFixed(2)}`;
    const isNew = !this.beacons.has(key);
    this.beacons.set(key, { lat, lng, lastSeen: Date.now() });
    if (isNew) {
      void this.topUp(lat, lng, 2).catch((err) =>
        this.logger.error(`initial top-up failed: ${String(err)}`),
      );
    }
  }

  private async tick() {
    try {
      const now = Date.now();

      for (const [key, beacon] of this.beacons) {
        if (now - beacon.lastSeen > this.BEACON_TTL_MS) {
          this.beacons.delete(key);
        }
      }

      // Despawn expired uncollected chests; sweep old collected audit rows.
      await this.spawnModel
        .deleteMany({ collectedBy: null, expiresAt: { $lt: new Date(now) } })
        .exec();
      await this.spawnModel
        .deleteMany({
          collectedBy: { $ne: null },
          collectedAt: { $lt: new Date(now - this.COLLECTED_KEEP_MS) },
        })
        .exec();

      for (const beacon of this.beacons.values()) {
        const batch = 1 + Math.floor(Math.random() * this.MAX_SPAWNS_PER_TICK);
        await this.topUp(beacon.lat, beacon.lng, batch);
      }
    } catch (err) {
      this.logger.error(`spawn tick failed: ${String(err)}`);
    }
  }

  /** Spawn up to `batch` chests near a point, respecting the area target. */
  private async topUp(lat: number, lng: number, batch: number) {
    const active = await this.spawnModel
      .find({ collectedBy: null, expiresAt: { $gt: new Date() } })
      .exec();
    const nearby = active.filter(
      (s) =>
        this.geoService.haversine(lat, lng, s.lat, s.lng) <=
        TreasureSpawnerService.SPAWN_RADIUS_KM,
    );

    const missing = Math.max(0, this.TARGET_ACTIVE - nearby.length);
    const count = Math.min(missing, batch);
    for (let i = 0; i < count; i++) {
      await this.spawnChest(lat, lng);
    }
  }

  private async spawnChest(centerLat: number, centerLng: number) {
    const rarity = this.rollRarity();
    const pool = TREASURE_CATALOG.filter(
      (item) => item.rarity === rarity && !item.craftOnly,
    );
    if (pool.length === 0) return;
    const item = pool[Math.floor(Math.random() * pool.length)];

    const { lat, lng } = this.randomPointAround(
      centerLat,
      centerLng,
      TreasureSpawnerService.SPAWN_RADIUS_KM,
    );
    const expiresAt = new Date(Date.now() + this.TTL_MINUTES[rarity] * 60_000);

    await this.spawnModel.create({
      itemId: item.id,
      rarity: item.rarity,
      lat,
      lng,
      expiresAt,
    });
  }

  private rollRarity(): Rarity {
    const entries = Object.entries(this.RARITY_WEIGHTS) as [Rarity, number][];
    const total = entries.reduce((sum, [, w]) => sum + w, 0);
    let roll = Math.random() * total;
    for (const [rarity, weight] of entries) {
      roll -= weight;
      if (roll <= 0) return rarity;
    }
    return Rarity.BASIC;
  }

  /** Uniform-ish random point in the ring [minOffset, radius] around a center. */
  private randomPointAround(lat: number, lng: number, radiusKm: number) {
    const min = this.MIN_OFFSET_KM;
    const max = Math.max(min + 0.05, radiusKm);
    const distanceKm = Math.sqrt(Math.random()) * (max - min) + min;
    const bearing = Math.random() * 2 * Math.PI;

    const latRad = (lat * Math.PI) / 180;
    const dLat = (distanceKm / this.EARTH_RADIUS_KM) * Math.cos(bearing);
    const dLng =
      ((distanceKm / this.EARTH_RADIUS_KM) * Math.sin(bearing)) /
      Math.cos(latRad);

    return {
      lat: lat + (dLat * 180) / Math.PI,
      lng: lng + (dLng * 180) / Math.PI,
    };
  }
}
