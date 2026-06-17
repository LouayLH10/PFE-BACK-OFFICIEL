import { Module } from '@nestjs/common';
import { OcrController } from './ocr.controller';
import { OcrService } from './ocr.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AiModule } from '../IA/ai/ai.module';



@Module({
  imports: [
    AiModule, // 🔥 IMPORTANT
  ],
  controllers: [OcrController],
  providers: [
    OcrService,
    PrismaService,
  ],
})
export class OcrModule {}