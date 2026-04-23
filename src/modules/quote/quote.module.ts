import { Module } from '@nestjs/common';
import { QuoteService } from './quote.service';
import { QuoteController } from './quote.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [QuoteController],
  providers: [QuoteService,PrismaService],
})
export class QuoteModule {}
