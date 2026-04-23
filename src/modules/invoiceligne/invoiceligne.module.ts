import { Module } from '@nestjs/common';
import { InvoiceligneService } from './invoiceligne.service';
import { InvoiceligneController } from './invoiceligne.controller';

@Module({
  controllers: [InvoiceligneController],
  providers: [InvoiceligneService],
})
export class InvoiceligneModule {}
