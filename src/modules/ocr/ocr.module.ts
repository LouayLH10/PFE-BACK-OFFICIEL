import { Module } from "@nestjs/common";
import { AiModule } from "../IA/ai/ai.module";
import { InvoiceModule } from "../invoice/invoice.module";
import { QuoteModule } from "../quote/quote.module";
import { ProjectModule } from "../project/project.module";
import { PurchaseOrderModule } from "../purchase-order/purchase-order.module";
import { OcrController } from "./ocr.controller";
import { OcrService } from "./ocr.service";

@Module({
  imports: [
    AiModule,
    InvoiceModule,
    QuoteModule,
    ProjectModule,
    PurchaseOrderModule,
  ],
  controllers: [OcrController],
  providers: [OcrService],
})
export class OcrModule {}