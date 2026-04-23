import { Module } from '@nestjs/common';
import { DelivrableService } from './delivrable.service';
import { DelivrableController } from './delivrable.controller';

@Module({
  controllers: [DelivrableController],
  providers: [DelivrableService],
})
export class DelivrableModule {}
