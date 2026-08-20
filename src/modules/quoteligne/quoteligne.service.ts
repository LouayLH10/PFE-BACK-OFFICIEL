import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { CreateQuoteligneDto } from './dto/create-quoteligne.dto';
import { UpdateQuoteligneDto } from './dto/update-quoteligne.dto';

@Injectable()
export class QuoteligneService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================
  // CREATE
  // =========================================

  async create(dto: CreateQuoteligneDto) {
    const totalPrice = dto.quantity * dto.unitPrice;

    return await this.prisma.$transaction(async (prisma) => {
      // 1. Vérifier le quote
      const quote = await prisma.quote.findUnique({
        where: {
          id: dto.quoteId,
        },
      });

      if (!quote) {
        throw new NotFoundException('Quote not found');
      }

      // 2. Créer la ligne
      const ligne = await prisma.quoteligne.create({
        data: {
          ...dto,
          totalPrice,
        },
      });

      // 3. Recalculer les montants du quote
      const newAmount = (quote.amount || 0) + totalPrice;

      const tvaAmount =
        (newAmount * quote.tva) / 100;

      const totalAmount =
        newAmount + tvaAmount;

      // 4. Mettre à jour le quote
      await prisma.quote.update({
        where: {
          id: dto.quoteId,
        },
        data: {
          amount: newAmount,
          totalAmount,
        },
      });

      return ligne;
    });
  }

  // =========================================
  // FIND ALL
  // =========================================

  async findAll() {
    return await this.prisma.quoteligne.findMany({
      include: {
        quote: true,
      },
      orderBy: {
        id: 'desc',
      },
    });
  }

  // =========================================
  // FIND ONE
  // =========================================

  async findOne(id: number) {
    const ligne =
      await this.prisma.quoteligne.findUnique({
        where: {
          id,
        },
        include: {
          quote: true,
        },
      });

    if (!ligne) {
      throw new NotFoundException(
        `Quote line #${id} not found`,
      );
    }

    return ligne;
  }

  // =========================================
  // UPDATE
  // =========================================

  async update(
    id: number,
    dto: UpdateQuoteligneDto,
  ) {
    return await this.prisma.$transaction(async (prisma) => {
      // 1. Récupérer l'ancienne ligne
      const old =
        await prisma.quoteligne.findUnique({
          where: {
            id,
          },
        });

      if (!old) {
        throw new NotFoundException(
          'Quote line not found',
        );
      }

      // 2. Calculer les nouvelles valeurs
      const quantity =
        dto.quantity ?? old.quantity;

      const unitPrice =
        dto.unitPrice ?? old.unitPrice;

      const newTotalPrice =
        quantity * unitPrice;

      // 3. Mettre à jour la ligne
      const updated =
        await prisma.quoteligne.update({
          where: {
            id,
          },
          data: {
            ...dto,
            totalPrice: newTotalPrice,
          },
        });

      // 4. Récupérer le quote
      const quote =
        await prisma.quote.findUnique({
          where: {
            id: old.quoteId,
          },
        });

      if (!quote) {
        throw new NotFoundException(
          'Quote not found',
        );
      }

      // 5. Recalculer le montant du quote
      const newAmount =
        (quote.amount || 0) -
        old.totalPrice +
        newTotalPrice;

      const tvaAmount =
        (newAmount * quote.tva) / 100;

      const totalAmount =
        newAmount + tvaAmount;

      // 6. Mettre à jour le quote
      await prisma.quote.update({
        where: {
          id: old.quoteId,
        },
        data: {
          amount: newAmount,
          totalAmount,
        },
      });

      return updated;
    });
  }

  // =========================================
  // DELETE
  // =========================================

  async remove(id: number) {
    return await this.prisma.$transaction(async (prisma) => {
      // 1. Récupérer la ligne
      const ligne =
        await prisma.quoteligne.findUnique({
          where: {
            id,
          },
        });

      if (!ligne) {
        throw new NotFoundException(
          'Quote line not found',
        );
      }

      // 2. Supprimer la ligne
      await prisma.quoteligne.delete({
        where: {
          id,
        },
      });

      // 3. Récupérer le quote
      const quote =
        await prisma.quote.findUnique({
          where: {
            id: ligne.quoteId,
          },
        });

      if (!quote) {
        throw new NotFoundException(
          'Quote not found',
        );
      }

      // 4. Recalculer le montant
      const newAmount =
        (quote.amount || 0) -
        ligne.totalPrice;

      const tvaAmount =
        (newAmount * quote.tva) / 100;

      const totalAmount =
        newAmount + tvaAmount;

      // 5. Mettre à jour le quote
      await prisma.quote.update({
        where: {
          id: ligne.quoteId,
        },
        data: {
          amount: newAmount,
          totalAmount,
        },
      });

      return {
        message: 'Deleted successfully',
      };
    });
  }

  // =========================================
  // FIND BY QUOTE
  // =========================================

  async findByQuote(quoteId: number) {
    return await this.prisma.quoteligne.findMany({
      where: {
        quoteId,
      },
      orderBy: {
        id: 'asc',
      },
    });
  }
}