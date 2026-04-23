import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseOrderligneController } from './purchase-orderligne.controller';
import { PurchaseOrderligneService } from './purchase-orderligne.service';

describe('PurchaseOrderligneController', () => {
  let controller: PurchaseOrderligneController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchaseOrderligneController],
      providers: [PurchaseOrderligneService],
    }).compile();

    controller = module.get<PurchaseOrderligneController>(PurchaseOrderligneController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
