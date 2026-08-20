import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { CreateInvoiceLigneDto } from './dto/create-invoiceligne.dto';
import { UpdateInvoiceligneDto } from './dto/update-invoiceligne.dto';

@Injectable()
export class InvoiceligneService {

  constructor(
    private prisma: PrismaService,
  ) {}

  // ============================================================
  // 1. CRÉATION D'UNE LIGNE DE FACTURE
  // ============================================================

  async create(dto: CreateInvoiceLigneDto) {

    // Calcul du montant total de la ligne
    // Total ligne = quantité × prix unitaire
    const totalPrice =
      dto.quantity * dto.unitPrice;

    // Utilisation d'une transaction pour garantir
    // la cohérence entre la ligne et la facture
    return await this.prisma.$transaction(
      async (prisma) => {

        // --------------------------------------------------------
        // 1.1 Création de la ligne de facture
        // --------------------------------------------------------

        const ligne =
          await prisma.invoiceLigne.create({
            data: {
              ...dto,
              totalPrice,
            },
          });

        // --------------------------------------------------------
        // 1.2 Récupération de la facture associée
        // --------------------------------------------------------

        const invoice =
          await prisma.invoice.findUnique({
            where: {
              id: dto.invoiceId,
            },
          });

        // --------------------------------------------------------
        // 1.3 Recalcul des montants de la facture
        // --------------------------------------------------------

        const tva =
          invoice?.tva ?? 19;

        const newSubTotal =
          (invoice?.subTotal || 0) +
          totalPrice;

        const taxTotal =
          newSubTotal * (tva / 100);

        const total =
          newSubTotal + taxTotal;

        // --------------------------------------------------------
        // 1.4 Mise à jour de la facture
        // --------------------------------------------------------

        await prisma.invoice.update({
          where: {
            id: dto.invoiceId,
          },

          data: {
            subTotal: newSubTotal,
            taxTotal,
            total,

            balanceDue:
              total -
              (invoice?.amountPaid || 0),
          },
        });

        return ligne;
      },
    );
  }


  // ============================================================
  // 2. RÉCUPÉRATION DE TOUTES LES LIGNES
  // ============================================================

  async findAll() {

    return await this.prisma.invoiceLigne.findMany({

      // Récupération également de la facture
      // associée à chaque ligne
      include: {
        invoice: true,
      },

    });
  }


  // ============================================================
  // 3. RÉCUPÉRATION D'UNE LIGNE PAR SON ID
  // ============================================================

  async findOne(id: number) {

    return await this.prisma.invoiceLigne.findUnique({

      where: {
        id,
      },

      // Retourner également la facture associée
      include: {
        invoice: true,
      },

    });
  }


  // ============================================================
  // 4. MODIFICATION D'UNE LIGNE DE FACTURE
  // ============================================================

  async update(
    id: number,
    dto: UpdateInvoiceligneDto,
  ) {

    // La modification de la ligne et le recalcul
    // de la facture sont réalisés dans une transaction
    return await this.prisma.$transaction(
      async (prisma) => {

        // --------------------------------------------------------
        // 4.1 Récupération de l'ancienne ligne
        // --------------------------------------------------------

        const old =
          await prisma.invoiceLigne.findUnique({
            where: {
              id,
            },
          });

        if (!old) {
          throw new Error('Line not found');
        }

        // --------------------------------------------------------
        // 4.2 Calcul du nouveau montant de la ligne
        // --------------------------------------------------------

        const newTotalPrice =
          (dto.quantity ?? old.quantity) *
          (dto.unitPrice ?? old.unitPrice);

        // --------------------------------------------------------
        // 4.3 Mise à jour de la ligne
        // --------------------------------------------------------

        const updated =
          await prisma.invoiceLigne.update({

            where: {
              id,
            },

            data: {
              ...dto,
              totalPrice: newTotalPrice,
            },

          });

        // --------------------------------------------------------
        // 4.4 Récupération de la facture
        // --------------------------------------------------------

        const invoice =
          await prisma.invoice.findUnique({

            where: {
              id: old.invoiceId,
            },

          });

        // --------------------------------------------------------
        // 4.5 Recalcul du sous-total
        // --------------------------------------------------------

        // On retire l'ancien montant
        // puis on ajoute le nouveau
        const newSubTotal =
          (invoice?.subTotal || 0)
          - old.totalPrice
          + newTotalPrice;

        // --------------------------------------------------------
        // 4.6 Recalcul TVA et total
        // --------------------------------------------------------

        const taxTotal =
          (newSubTotal * 19) / 100;

        const total =
          newSubTotal + taxTotal;

        // --------------------------------------------------------
        // 4.7 Mise à jour de la facture
        // --------------------------------------------------------

        await prisma.invoice.update({

          where: {
            id: old.invoiceId,
          },

          data: {

            subTotal:
              newSubTotal,

            taxTotal,

            total,

            balanceDue:
              total -
              (invoice?.amountPaid || 0),

          },

        });

        return updated;
      },
    );
  }


  // ============================================================
  // 5. SUPPRESSION D'UNE LIGNE DE FACTURE
  // ============================================================

  async remove(id: number) {

    // Suppression et recalcul réalisés
    // dans une seule transaction
    return await this.prisma.$transaction(
      async (prisma) => {

        // --------------------------------------------------------
        // 5.1 Récupération de la ligne
        // --------------------------------------------------------

        const ligne =
          await prisma.invoiceLigne.findUnique({

            where: {
              id,
            },

          });

        if (!ligne) {
          throw new Error('Line not found');
        }

        // --------------------------------------------------------
        // 5.2 Suppression de la ligne
        // --------------------------------------------------------

        await prisma.invoiceLigne.delete({

          where: {
            id,
          },

        });

        // --------------------------------------------------------
        // 5.3 Récupération de la facture
        // --------------------------------------------------------

        const invoice =
          await prisma.invoice.findUnique({

            where: {
              id: ligne.invoiceId,
            },

          });

        // --------------------------------------------------------
        // 5.4 Recalcul du sous-total
        // --------------------------------------------------------

        const newSubTotal =
          (invoice?.subTotal || 0)
          - ligne.totalPrice;

        // --------------------------------------------------------
        // 5.5 Recalcul TVA et total
        // --------------------------------------------------------

        const taxTotal =
          (newSubTotal * 19) / 100;

        const total =
          newSubTotal + taxTotal;

        // --------------------------------------------------------
        // 5.6 Mise à jour de la facture
        // --------------------------------------------------------

        await prisma.invoice.update({

          where: {
            id: ligne.invoiceId,
          },

          data: {

            subTotal:
              newSubTotal,

            taxTotal,

            total,

            balanceDue:
              total -
              (invoice?.amountPaid || 0),

          },

        });

        return {
          message: 'Deleted successfully',
        };
      },
    );
  }

}