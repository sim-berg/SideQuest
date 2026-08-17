import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wallet, WalletDocument } from './schemas/wallet.schema.js';
import {
  CoinTransaction,
  CoinTransactionDocument,
} from './schemas/coin-transaction.schema.js';
import { COIN, STARTER_GRANT, SYSTEM_ACCOUNT } from './coin.constants.js';

export interface TransferRef {
  refType: string;
  refId: string;
}

/**
 * The only place in the app that moves coins. Three primitives:
 *
 *  - mint(to, ...)      system → account (rewards; the "faucet")
 *  - transfer(from, to) account → account (stakes, trades, escrow)
 *  - burn(from, ...)    account → system (fees, sinks)
 *
 * Every primitive appends a CoinTransaction and updates the wallet read
 * model with an overdraft-guarded conditional update. A later blockchain
 * backend reimplements these three against the chain and deletes the rest.
 */
@Injectable()
export class CoinService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(CoinTransaction.name)
    private txModel: Model<CoinTransactionDocument>,
  ) {}

  /** Wallet of an account, created (with the starter grant for users) lazily. */
  async ensureWallet(accountId: string): Promise<WalletDocument> {
    const existing = await this.walletModel.findOne({ accountId }).exec();
    if (existing) return existing;

    const wallet = await this.walletModel
      .findOneAndUpdate(
        { accountId },
        { $setOnInsert: { accountId, balance: 0 } },
        { upsert: true, new: true },
      )
      .exec();

    // Only real users get the welcome coins — escrow accounts start empty.
    const isVirtual = accountId.includes(':') || accountId === SYSTEM_ACCOUNT;
    if (!isVirtual && wallet.balance === 0) {
      const alreadyGranted = await this.txModel
        .exists({ to: accountId, reason: 'starter_grant' })
        .exec();
      if (!alreadyGranted) {
        await this.mint(accountId, STARTER_GRANT, 'starter_grant');
        wallet.balance += STARTER_GRANT;
      }
    }
    return wallet;
  }

  async getBalance(accountId: string): Promise<number> {
    const wallet = await this.ensureWallet(accountId);
    return wallet.balance;
  }

  /** Balance + currency metadata, shaped for the frontend. */
  async getWalletView(accountId: string) {
    return {
      balance: await this.getBalance(accountId),
      symbol: COIN.symbol,
      name: COIN.name,
      emoji: COIN.emoji,
    };
  }

  /** Create coins out of thin air (rewards). */
  async mint(
    to: string,
    amount: number,
    reason: string,
    ref?: TransferRef,
  ): Promise<void> {
    this.assertAmount(amount);
    await this.walletModel
      .findOneAndUpdate(
        { accountId: to },
        { $inc: { balance: amount }, $setOnInsert: { accountId: to } },
        { upsert: true },
      )
      .exec();
    await this.append(SYSTEM_ACCOUNT, to, amount, reason, ref);
  }

  /** Move coins between two accounts; throws when `from` cannot cover it. */
  async transfer(
    from: string,
    to: string,
    amount: number,
    reason: string,
    ref?: TransferRef,
  ): Promise<void> {
    this.assertAmount(amount);
    if (from === to) {
      throw new BadRequestException('Sender und Empfänger sind identisch');
    }
    await this.ensureWallet(from);

    // Overdraft guard: the decrement only matches while the balance covers it.
    const debited = await this.walletModel
      .findOneAndUpdate(
        { accountId: from, balance: { $gte: amount } },
        { $inc: { balance: -amount } },
        { new: true },
      )
      .exec();
    if (!debited) {
      throw new ConflictException(
        `Nicht genug ${COIN.name} — du brauchst ${amount} ${COIN.symbol}.`,
      );
    }

    await this.walletModel
      .findOneAndUpdate(
        { accountId: to },
        { $inc: { balance: amount }, $setOnInsert: { accountId: to } },
        { upsert: true },
      )
      .exec();
    await this.append(from, to, amount, reason, ref);
  }

  /** Destroy coins (sinks). */
  async burn(
    from: string,
    amount: number,
    reason: string,
    ref?: TransferRef,
  ): Promise<void> {
    this.assertAmount(amount);
    const debited = await this.walletModel
      .findOneAndUpdate(
        { accountId: from, balance: { $gte: amount } },
        { $inc: { balance: -amount } },
        { new: true },
      )
      .exec();
    if (!debited) {
      throw new ConflictException(`Nicht genug ${COIN.name}.`);
    }
    await this.append(from, SYSTEM_ACCOUNT, amount, reason, ref);
  }

  /** Recent ledger entries touching an account, newest first. */
  async getHistory(accountId: string, limit = 50) {
    const docs = await this.txModel
      .find({ $or: [{ from: accountId }, { to: accountId }] })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    return docs.map((doc) => ({
      id: doc._id.toString(),
      from: doc.from,
      to: doc.to,
      amount: doc.amount,
      /** Signed from the account's point of view. */
      delta: doc.to === accountId ? doc.amount : -doc.amount,
      reason: doc.reason,
      refType: doc.refType,
      refId: doc.refId,
      createdAt: doc.createdAt.toISOString(),
    }));
  }

  private async append(
    from: string,
    to: string,
    amount: number,
    reason: string,
    ref?: TransferRef,
  ): Promise<void> {
    await this.txModel.create({
      from,
      to,
      amount,
      reason,
      refType: ref?.refType ?? null,
      refId: ref?.refId ?? null,
    });
  }

  private assertAmount(amount: number): void {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new BadRequestException(
        'Betrag muss eine positive ganze Zahl sein',
      );
    }
  }
}
