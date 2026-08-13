import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoinController } from './coin.controller.js';
import { CoinService } from './coin.service.js';
import { Wallet, WalletSchema } from './schemas/wallet.schema.js';
import {
  CoinTransaction,
  CoinTransactionSchema,
} from './schemas/coin-transaction.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wallet.name, schema: WalletSchema },
      { name: CoinTransaction.name, schema: CoinTransactionSchema },
    ]),
  ],
  controllers: [CoinController],
  providers: [CoinService],
  exports: [CoinService],
})
export class CoinModule {}
