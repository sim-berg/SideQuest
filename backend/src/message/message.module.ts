import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { Message, MessageSchema } from './schemas/message.schema.js';
import { MessageService } from './message.service.js';
import { MessageGateway } from './message.gateway.js';
import { MessageController } from './message.controller.js';
import { UserModule } from '../user/user.module.js';
import { GeoModule } from '../geo/geo.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'sidequest-dev-secret',
    }),
    UserModule,
    GeoModule,
  ],
  controllers: [MessageController],
  providers: [MessageService, MessageGateway],
  exports: [MessageService],
})
export class MessageModule {}
