import { Test, TestingModule } from '@nestjs/testing';
import { QuoteService } from './quote.service';
import { beforeEach, describe, it,expect } from 'node:test';

describe('QuoteService', () => {
  let service: QuoteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuoteService],
    }).compile();

    service = module.get<QuoteService>(QuoteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
