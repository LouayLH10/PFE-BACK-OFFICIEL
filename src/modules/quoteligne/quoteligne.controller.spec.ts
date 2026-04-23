import { Test, TestingModule } from '@nestjs/testing';
import { QuoteligneController } from './quoteligne.controller';
import { QuoteligneService } from './quoteligne.service';

describe('QuoteligneController', () => {
  let controller: QuoteligneController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuoteligneController],
      providers: [QuoteligneService],
    }).compile();

    controller = module.get<QuoteligneController>(QuoteligneController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
