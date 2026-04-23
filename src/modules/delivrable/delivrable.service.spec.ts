import { Test, TestingModule } from '@nestjs/testing';
import { DelivrableService } from './delivrable.service';

describe('DelivrableService', () => {
  let service: DelivrableService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DelivrableService],
    }).compile();

    service = module.get<DelivrableService>(DelivrableService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
