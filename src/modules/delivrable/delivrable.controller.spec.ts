import { Test, TestingModule } from '@nestjs/testing';
import { DelivrableController } from './delivrable.controller';
import { DelivrableService } from './delivrable.service';

describe('DelivrableController', () => {
  let controller: DelivrableController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DelivrableController],
      providers: [DelivrableService],
    }).compile();

    controller = module.get<DelivrableController>(DelivrableController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
