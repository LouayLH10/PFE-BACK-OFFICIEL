import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { AiService } from '../IA/ai/ai.service';
import { ProductService } from '../product/product.service';
import { QuoteService } from '../quote/quote.service';

import { SimulateVoiceDto } from './dto/simulate-voice.dto';

@Injectable()
export class VoiceAssistantService {
  constructor(
    private readonly aiService: AiService,
    private readonly productService: ProductService,
    private readonly quoteService: QuoteService,
  ) {}

  // =========================================
  // SIMULATE VOICE ASSISTANT
  // =========================================

  async simulate(
    dto: SimulateVoiceDto,
    userId: number,
  ) {
    // =========================================
    // 1. AI - EXTRACT PRODUCTS FROM TEXT
    // =========================================

    const aiResult = await this.aiService.extractProducts(
      dto.text,
    );

    console.log('🤖 AI RESULT:', aiResult);

    // =========================================
    // 2. SEARCH PRODUCTS IN DATABASE
    // =========================================

    const searchResult =
      await this.productService.searchProducts(
        aiResult.products,
      );

    console.log(
      '🔎 SEARCH RESULT:',
      searchResult,
    );

    // =========================================
    // 3. VERIFY PRODUCTS
    // =========================================

    if (searchResult.notFound.length > 0) {
      throw new BadRequestException({
        message: 'Some products were not found.',
        missingProducts: searchResult.notFound,
      });
    }

    // =========================================
    // 4. CREATE QUOTE PDF
    // =========================================

    return this.quoteService.createVoiceQuote(
      userId,
      aiResult.language,
      searchResult.found,
    );
  }
}