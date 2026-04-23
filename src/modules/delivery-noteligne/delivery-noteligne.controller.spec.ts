import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryNoteligneController } from './delivery-noteligne.controller';
import { DeliveryNoteligneService } from './delivery-noteligne.service';

describe('DeliveryNoteligneController', () => {
  let controller: DeliveryNoteligneController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeliveryNoteligneController],
      providers: [DeliveryNoteligneService],
    }).compile();

    controller = module.get<DeliveryNoteligneController>(DeliveryNoteligneController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
