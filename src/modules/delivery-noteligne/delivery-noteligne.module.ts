import { Module } from '@nestjs/common';
import { DeliveryNoteligneService } from './delivery-noteligne.service';
import { DeliveryNoteligneController } from './delivery-noteligne.controller';

@Module({
  controllers: [DeliveryNoteligneController],
  providers: [DeliveryNoteligneService],
})
export class DeliveryNoteligneModule {}
