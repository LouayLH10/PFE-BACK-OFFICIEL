import { Test, TestingModule } from '@nestjs/testing';
import { VoiceAssistantController } from './voice-assistant.controller';
import { VoiceAssistantService } from './voice-assistant.service';

describe('VoiceAssistantController', () => {
  let controller: VoiceAssistantController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VoiceAssistantController],
      providers: [VoiceAssistantService],
    }).compile();

    controller = module.get<VoiceAssistantController>(VoiceAssistantController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
