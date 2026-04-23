import { Module } from '@nestjs/common';
import { PurchaseOrderligneService } from './purchase-orderligne.service';
import { PurchaseOrderligneController } from './purchase-orderligne.controller';

@Module({
  controllers: [PurchaseOrderligneController],
  providers: [PurchaseOrderligneService],
})
export class PurchaseOrderligneModule {}
