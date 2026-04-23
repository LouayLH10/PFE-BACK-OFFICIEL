import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceligneController } from './invoiceligne.controller';
import { InvoiceligneService } from './invoiceligne.service';

describe('InvoiceligneController', () => {
  let controller: InvoiceligneController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvoiceligneController],
      providers: [InvoiceligneService],
    }).compile();

    controller = module.get<InvoiceligneController>(InvoiceligneController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
