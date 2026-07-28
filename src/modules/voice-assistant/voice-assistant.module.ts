import { Module } from '@nestjs/common';
import { VoiceAssistantService } from './voice-assistant.service';
import { VoiceAssistantController } from './voice-assistant.controller';
import { AiModule } from '../IA/ai/ai.module';
import { ProductModule } from '../product/product.module';
import { AiService } from '../IA/ai/ai.service';
import { InvoiceModule } from '../invoice/invoice.module';
import { QuoteModule } from '../quote/quote.module';

@Module({
  controllers: [VoiceAssistantController],
  providers: [VoiceAssistantService],
  imports:[
    AiModule,
    ProductModule,
    AiModule,
    QuoteModule
]
})
export class VoiceAssistantModule {}
