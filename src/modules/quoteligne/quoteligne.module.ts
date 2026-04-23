import { Module } from '@nestjs/common';
import { QuoteligneService } from './quoteligne.service';
import { QuoteligneController } from './quoteligne.controller';

@Module({
  controllers: [QuoteligneController],
  providers: [QuoteligneService],
})
export class QuoteligneModule {}
