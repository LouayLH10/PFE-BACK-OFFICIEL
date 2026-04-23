import { Module } from '@nestjs/common';
import { DeliveryNoteService } from './delivery-note.service';
import { DeliveryNoteController } from './delivery-note.controller';

@Module({
  controllers: [DeliveryNoteController],
  providers: [DeliveryNoteService],
})
export class DeliveryNoteModule {}
