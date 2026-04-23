import { Injectable } from '@nestjs/common';
import { CreateQuoteligneDto } from './dto/create-quoteligne.dto';
import { UpdateQuoteligneDto } from './dto/update-quoteligne.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class QuoteligneService {
   constructor(private prisma: PrismaService) {}
async create(dto: CreateQuoteligneDto) {
  const totalPrice = dto.quantity * dto.unitPrice;

  return await this.prisma.$transaction(async (prisma) => {
    const ligne = await prisma.quoteligne.create({
      data: {
        ...dto,
        totalPrice,
      },
    });

    // récupérer quote pour recalcul TVA
    const quote = await prisma.quote.findUnique({
      where: { id: dto.quoteId },
    });

    const newAmount = (quote?.amount || 0) + totalPrice;
    const tvaAmount = (newAmount * quote!.tva) / 100;
    const totalAmount = newAmount + tvaAmount;

    await prisma.quote.update({
      where: { id: dto.quoteId },
      data: {
        amount: newAmount,
        totalAmount: totalAmount,
      },
    });

    return ligne;
  });
}

  findAll() {
    return `This action returns all quoteligne`;
  }

  findOne(id: number) {
    return `This action returns a #${id} quoteligne`;
  }

  update(id: number, updateQuoteligneDto: UpdateQuoteligneDto) {
    return `This action updates a #${id} quoteligne`;
  }

  remove(id: number) {
    return `This action removes a #${id} quoteligne`;
  }
}
