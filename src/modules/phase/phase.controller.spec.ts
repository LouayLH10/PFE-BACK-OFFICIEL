import { Test, TestingModule } from '@nestjs/testing';
import { PhaseController } from './phase.controller';
import { PhaseService } from './phase.service';

describe('PhaseController', () => {
  let controller: PhaseController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PhaseController],
      providers: [PhaseService],
    }).compile();

    controller = module.get<PhaseController>(PhaseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
