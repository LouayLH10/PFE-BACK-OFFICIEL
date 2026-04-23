import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryNoteligneService } from './delivery-noteligne.service';

describe('DeliveryNoteligneService', () => {
  let service: DeliveryNoteligneService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeliveryNoteligneService],
    }).compile();

    service = module.get<DeliveryNoteligneService>(DeliveryNoteligneService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
