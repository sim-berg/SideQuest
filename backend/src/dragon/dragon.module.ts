import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Dragon, DragonSchema } from './schemas/dragon.schema.js';
import { DragonController } from './dragon.controller.js';
import { DragonService } from './dragon.service.js';
import { UserModule } from '../user/user.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Dragon.name, schema: DragonSchema }]),
    UserModule,
  ],
  controllers: [DragonController],
  providers: [DragonService],
  exports: [DragonService],
})
export class DragonModule {}
