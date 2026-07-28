import { BadRequestException, Injectable } from '@nestjs/common';
import { AiService } from '../IA/ai/ai.service';
import { ProductService } from '../product/product.service';
import { SimulateVoiceDto } from './dto/simulate-voice.dto';
import { QuoteService } from '../quote/quote.service';

@Injectable()
export class VoiceAssistantService {
    constructor(
    private readonly aiService: AiService,
    private readonly productService: ProductService,
    private readonly quoteService: QuoteService
) {}
async simulate(dto: SimulateVoiceDto, userId: number) {

    const aiResult = await this.aiService.extractProducts(dto.text);

    console.log("AI RESULT:", aiResult);

    const searchResult = await this.productService.searchProducts(
        aiResult.products,
    );

    console.log("SEARCH RESULT:", searchResult);

    if (searchResult.notFound.length > 0) {
        throw new BadRequestException({
            message: "Some products were not found.",
            missingProducts: searchResult.notFound,
        }); 
    }

    return this.quoteService.createVoiceQuote(
        userId,
        aiResult.language,
        searchResult.found,
    );

}
}
