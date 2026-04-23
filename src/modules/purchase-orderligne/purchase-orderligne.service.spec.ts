import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseOrderligneService } from './purchase-orderligne.service';

describe('PurchaseOrderligneService', () => {
  let service: PurchaseOrderligneService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PurchaseOrderligneService],
    }).compile();

    service = module.get<PurchaseOrderligneService>(PurchaseOrderligneService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
