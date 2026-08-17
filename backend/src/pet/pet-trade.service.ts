import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Pet, PetDocument } from './schemas/pet.schema.js';
import { PetTrade, PetTradeDocument } from './schemas/pet-trade.schema.js';
import { toPlainPet } from './pet.service.js';
import { CoinService } from '../coin/coin.service.js';
import { UserService } from '../user/user.service.js';

export interface PetTradeView {
  id: string;
  pet: ReturnType<typeof toPlainPet> | null;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  toUsername: string;
  price: number;
  status: string;
  createdAt: string;
}

/**
 * Directed pet trades: offer one of your pets to another user for coins
 * (price 0 = gift). Coins move through the ledger, ownership moves on
 * accept, and a traded-away active companion is replaced by a fresh
 * starter egg so nobody is ever pet-less.
 */
@Injectable()
export class PetTradeService {
  constructor(
    @InjectModel(Pet.name) private petModel: Model<PetDocument>,
    @InjectModel(PetTrade.name) private tradeModel: Model<PetTradeDocument>,
    private readonly coinService: CoinService,
    private readonly userService: UserService,
  ) {}

  async createOffer(
    fromUserId: string,
    petId: string,
    toUsername: string,
    price: number,
  ): Promise<PetTradeView> {
    if (!Number.isInteger(price) || price < 0 || price > 100_000) {
      throw new BadRequestException('Preis muss zwischen 0 und 100000 liegen');
    }

    const pet = await this.petModel
      .findOne({ _id: petId, userId: fromUserId })
      .exec();
    if (!pet) throw new NotFoundException('Pet nicht gefunden');
    if (!pet.species) {
      throw new BadRequestException(
        'Ungeschlüpfte Eier können nicht gehandelt werden',
      );
    }

    const recipient = await this.userService.findByUsername(toUsername.trim());
    if (!recipient) {
      throw new NotFoundException(`Kein Nutzer namens „${toUsername}“`);
    }
    const toUserId = (recipient as any)._id.toString();
    if (toUserId === fromUserId) {
      throw new BadRequestException('Du kannst nicht mit dir selbst handeln');
    }

    const open = await this.tradeModel.exists({ petId, status: 'open' }).exec();
    if (open) {
      throw new ConflictException('Für dieses Pet läuft bereits ein Angebot');
    }

    const doc = await this.tradeModel.create({
      petId,
      fromUserId,
      toUserId,
      price,
    });
    return this.toView(doc);
  }

  /** Offers involving me (open incoming + open outgoing), newest first. */
  async listMine(userId: string): Promise<PetTradeView[]> {
    const docs = await this.tradeModel
      .find({
        status: 'open',
        $or: [{ fromUserId: userId }, { toUserId: userId }],
      })
      .sort({ createdAt: -1 })
      .exec();
    return Promise.all(docs.map((d) => this.toView(d)));
  }

  async accept(tradeId: string, userId: string) {
    const trade = await this.loadOpen(tradeId);
    if (trade.toUserId !== userId) {
      throw new BadRequestException(
        'Dieses Angebot ist nicht an dich gerichtet',
      );
    }

    const pet = await this.petModel
      .findOne({ _id: trade.petId, userId: trade.fromUserId })
      .exec();
    if (!pet) {
      // Seller no longer owns the pet — offer is dead.
      trade.status = 'cancelled';
      trade.resolvedAt = new Date();
      await trade.save();
      throw new ConflictException('Das Pet gehört dem Anbieter nicht mehr');
    }

    if (trade.price > 0) {
      await this.coinService.transfer(
        userId,
        trade.fromUserId,
        trade.price,
        'pet_trade',
        { refType: 'pet_trade', refId: trade._id.toString() },
      );
    }

    const wasActive = pet.isActive;
    pet.userId = userId;
    pet.isActive = false;
    pet.obtainedFrom = 'trade';
    await pet.save();

    // The seller traded away their guide — hand them a fresh mystery egg
    // (or promote another pet) so the companion loop never breaks.
    if (wasActive) {
      const remaining = await this.petModel
        .findOne({ userId: trade.fromUserId })
        .sort({ createdAt: 1 })
        .exec();
      if (remaining) {
        remaining.isActive = true;
        await remaining.save();
      } else {
        await this.petModel.create({
          userId: trade.fromUserId,
          isActive: true,
          obtainedFrom: 'starter',
        });
      }
    }

    trade.status = 'accepted';
    trade.resolvedAt = new Date();
    await trade.save();

    return { trade: await this.toView(trade), pet: toPlainPet(pet) };
  }

  async decline(tradeId: string, userId: string): Promise<PetTradeView> {
    const trade = await this.loadOpen(tradeId);
    if (trade.toUserId !== userId) {
      throw new BadRequestException(
        'Dieses Angebot ist nicht an dich gerichtet',
      );
    }
    trade.status = 'declined';
    trade.resolvedAt = new Date();
    await trade.save();
    return this.toView(trade);
  }

  async cancel(tradeId: string, userId: string): Promise<PetTradeView> {
    const trade = await this.loadOpen(tradeId);
    if (trade.fromUserId !== userId) {
      throw new BadRequestException('Nur der Anbieter kann zurückziehen');
    }
    trade.status = 'cancelled';
    trade.resolvedAt = new Date();
    await trade.save();
    return this.toView(trade);
  }

  private async loadOpen(tradeId: string): Promise<PetTradeDocument> {
    const trade = await this.tradeModel.findById(tradeId).exec();
    if (!trade) throw new NotFoundException('Angebot nicht gefunden');
    if (trade.status !== 'open') {
      throw new ConflictException('Angebot ist nicht mehr offen');
    }
    return trade;
  }

  private async toView(doc: PetTradeDocument): Promise<PetTradeView> {
    const [pet, from, to] = await Promise.all([
      this.petModel.findById(doc.petId).exec(),
      this.userService.findById(doc.fromUserId).catch(() => null),
      this.userService.findById(doc.toUserId).catch(() => null),
    ]);
    return {
      id: doc._id.toString(),
      pet: pet ? toPlainPet(pet) : null,
      fromUserId: doc.fromUserId,
      fromUsername: from?.username ?? '???',
      toUserId: doc.toUserId,
      toUsername: to?.username ?? '???',
      price: doc.price,
      status: doc.status,
      createdAt: doc.createdAt.toISOString(),
    };
  }
}
