import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { CreatePurchaseOrderligneDto } from './dto/create-purchase-orderligne.dto';
import { UpdatePurchaseOrderligneDto } from './dto/update-purchase-orderligne.dto';

@Injectable()
export class PurchaseOrderligneService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================
  // CREATE
  // =========================================================

  async create(dto: CreatePurchaseOrderligneDto) {
    // 1. Calcul du prix HT
    const totalPriceWithoutTVA =
      dto.quantity * dto.unitPrice;

    // 2. Calcul du prix TTC
    const totalPrice =
      totalPriceWithoutTVA +
      (totalPriceWithoutTVA * dto.tva) / 100;

    return await this.prisma.$transaction(async (prisma) => {
      // 3. Création de la ligne
      const line = await prisma.purchaseOrderLine.create({
        data: {
          ...dto,
          totalPriceWithoutTVA,
          totalPrice,
        },
      });

      // 4. Récupération de la commande
      const purchaseOrder =
        await prisma.purchaseOrder.findUnique({
          where: {
            id: dto.purchaseOrderId,
          },
        });

      // 5. Recalcul des totaux de la commande
      const newSubTotal =
        (purchaseOrder?.subTotal || 0) +
        totalPriceWithoutTVA;

      const newTax =
        (purchaseOrder?.tax || 0) +
        (totalPrice - totalPriceWithoutTVA);

      const newTotal = newSubTotal + newTax;

      // 6. Mise à jour de la commande
      await prisma.purchaseOrder.update({
        where: {
          id: dto.purchaseOrderId,
        },
        data: {
          subTotal: newSubTotal,
          tax: newTax,
          total: newTotal,
        },
      });

      return line;
    });
  }

  // =========================================================
  // FIND ALL
  // =========================================================

  async findAll() {
    return await this.prisma.purchaseOrderLine.findMany({
      include: {
        purchaseOrder: true,
      },
    });
  }

  // =========================================================
  // FIND ONE
  // =========================================================

  async findOne(id: number) {
    return await this.prisma.purchaseOrderLine.findUnique({
      where: {
        id,
      },
      include: {
        purchaseOrder: true,
      },
    });
  }

  // =========================================================
  // UPDATE
  // =========================================================

  async update(
    id: number,
    dto: UpdatePurchaseOrderligneDto,
  ) {
    return await this.prisma.$transaction(async (prisma) => {
      // 1. Récupérer l'ancienne ligne
      const oldLine =
        await prisma.purchaseOrderLine.findUnique({
          where: {
            id,
          },
        });

      if (!oldLine) {
        throw new Error('Line not found');
      }

      // 2. Récupérer les nouvelles valeurs
      const quantity =
        dto.quantity ?? oldLine.quantity;

      const unitPrice =
        dto.unitPrice ?? oldLine.unitPrice;

      const tva =
        dto.tva ?? oldLine.tva;

      // 3. Recalcul du prix HT
      const newWithoutTVA =
        quantity * unitPrice;

      // 4. Recalcul du prix TTC
      const newTotal =
        newWithoutTVA +
        (newWithoutTVA * tva) / 100;

      // 5. Mise à jour de la ligne
      const updatedLine =
        await prisma.purchaseOrderLine.update({
          where: {
            id,
          },
          data: {
            ...dto,
            totalPriceWithoutTVA: newWithoutTVA,
            totalPrice: newTotal,
          },
        });

      // 6. Récupérer la commande
      const purchaseOrder =
        await prisma.purchaseOrder.findUnique({
          where: {
            id: oldLine.purchaseOrderId,
          },
        });

      // 7. Calcul de l'ancien et du nouveau montant TVA
      const oldTax =
        oldLine.totalPrice -
        oldLine.totalPriceWithoutTVA;

      const newTax =
        newTotal - newWithoutTVA;

      // 8. Recalcul du sous-total
      const newSubTotal =
        (purchaseOrder?.subTotal || 0) -
        oldLine.totalPriceWithoutTVA +
        newWithoutTVA;

      // 9. Recalcul de la TVA totale
      const updatedTax =
        (purchaseOrder?.tax || 0) -
        oldTax +
        newTax;

      // 10. Recalcul du total
      const newTotalPO =
        newSubTotal + updatedTax;

      // 11. Mise à jour de la commande
      await prisma.purchaseOrder.update({
        where: {
          id: oldLine.purchaseOrderId,
        },
        data: {
          subTotal: newSubTotal,
          tax: updatedTax,
          total: newTotalPO,
        },
      });

      return updatedLine;
    });
  }

  // =========================================================
  // DELETE
  // =========================================================

  async remove(id: number) {
    return await this.prisma.$transaction(async (prisma) => {
      // 1. Récupérer la ligne
      const line =
        await prisma.purchaseOrderLine.findUnique({
          where: {
            id,
          },
        });

      if (!line) {
        throw new Error('Line not found');
      }

      // 2. Calculer la partie TVA de la ligne
      const taxPart =
        line.totalPrice -
        line.totalPriceWithoutTVA;

      // 3. Supprimer la ligne
      await prisma.purchaseOrderLine.delete({
        where: {
          id,
        },
      });

      // 4. Récupérer la commande
      const purchaseOrder =
        await prisma.purchaseOrder.findUnique({
          where: {
            id: line.purchaseOrderId,
          },
        });

      // 5. Recalcul du sous-total
      const newSubTotal =
        (purchaseOrder?.subTotal || 0) -
        line.totalPriceWithoutTVA;

      // 6. Recalcul de la TVA
      const newTax =
        (purchaseOrder?.tax || 0) -
        taxPart;

      // 7. Recalcul du total
      const newTotal =
        newSubTotal + newTax;

      // 8. Mise à jour de la commande
      await prisma.purchaseOrder.update({
        where: {
          id: line.purchaseOrderId,
        },
        data: {
          subTotal: newSubTotal,
          tax: newTax,
          total: newTotal,
        },
      });

      return {
        message: 'Deleted successfully',
      };
    });
  }
}