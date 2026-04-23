import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceligneService } from './invoiceligne.service';

describe('InvoiceligneService', () => {
  let service: InvoiceligneService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InvoiceligneService],
    }).compile();

    service = module.get<InvoiceligneService>(InvoiceligneService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
