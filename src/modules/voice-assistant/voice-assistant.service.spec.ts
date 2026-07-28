import { Test, TestingModule } from '@nestjs/testing';
import { VoiceAssistantService } from './voice-assistant.service';

describe('VoiceAssistantService', () => {
  let service: VoiceAssistantService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VoiceAssistantService],
    }).compile();

    service = module.get<VoiceAssistantService>(VoiceAssistantService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
