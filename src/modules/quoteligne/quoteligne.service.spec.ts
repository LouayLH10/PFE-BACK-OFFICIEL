import { Test, TestingModule } from '@nestjs/testing';
import { QuoteligneService } from './quoteligne.service';

describe('QuoteligneService', () => {
  let service: QuoteligneService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuoteligneService],
    }).compile();

    service = module.get<QuoteligneService>(QuoteligneService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
