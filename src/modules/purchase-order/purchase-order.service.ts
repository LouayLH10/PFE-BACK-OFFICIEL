import { Injectable } from '@nestjs/common';

import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';

import { PrismaService } from 'src/prisma/prisma.service';

import * as path from 'path';
import * as fs from 'fs';
import * as handlebars from 'handlebars';

import puppeteer from 'puppeteer';
import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

@Injectable()
export class PurchaseOrderService {
  constructor(private prisma: PrismaService) {}

  // =========================================================
  // CREATE
  // =========================================================

  async create(dto: CreatePurchaseOrderDto) {
    const { contactId, ...data } = dto;

    const year = new Date().getFullYear();

    // Récupérer le dernier Purchase Order
    const lastPurchaseOrder =
      await this.prisma.purchaseOrder.findFirst({
        orderBy: {
          id: 'desc',
        },
      });

    // Générer le prochain numéro
    let nextNumber = 1;

    if (lastPurchaseOrder?.reference) {
      const lastNumber = parseInt(
        lastPurchaseOrder.reference.split('-')[2],
      );

      nextNumber = lastNumber + 1;
    }

    const reference = `SO-${year}-${String(nextNumber).padStart(4, '0')}`;

    return await this.prisma.purchaseOrder.create({
      data: {
        ...data,

        reference,

        // Initialisation des montants
        subTotal: 0,
        tax: 0,
        total: 0,

        // Relation avec le contact
        contact: {
          connect: {
            id: contactId,
          },
        },
      },

      include: {
        contact: true,
      },
    });
  }

  // =========================================================
  // FIND ALL
  // =========================================================

  async findAll() {
    return await this.prisma.purchaseOrder.findMany({
      include: {
        contact: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // =========================================================
  // FIND ONE
  // =========================================================

  async findOne(id: number) {
    return await this.prisma.purchaseOrder.findUnique({
      where: {
        id,
      },

      include: {
        contact: true,
        items: true,
      },
    });
  }

  // =========================================================
  // UPDATE
  // =========================================================

  async update(
    id: number,
    dto: UpdatePurchaseOrderDto,
  ) {
    const { contactId, ...data } = dto;

    return await this.prisma.purchaseOrder.update({
      where: {
        id,
      },

      data: {
        ...data,

        ...(contactId && {
          contact: {
            connect: {
              id: contactId,
            },
          },
        }),
      },

      include: {
        contact: true,
      },
    });
  }

  // =========================================================
  // DELETE
  // =========================================================

  async remove(id: number) {
    return await this.prisma.purchaseOrder.delete({
      where: {
        id,
      },
    });
  }

  // =========================================================
  // FIND PURCHASE ORDERS BY USER
  // =========================================================

  async findByUser(userId: number) {
    return await this.prisma.purchaseOrder.findMany({
      where: {
        contact: {
          userId,
        },
      },

      include: {
        items: true,

        contact: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // =========================================================
  // MAP PURCHASE ORDER TO PDF TEMPLATE
  // =========================================================

  private mapToTemplate(purchaseOrder: any) {
    return {
      numero: purchaseOrder.reference,

      date: new Date(
        purchaseOrder.createdAt,
      ).toLocaleDateString(),

      supplierName:
        purchaseOrder.contact.user.name,

      supplierEmail:
        purchaseOrder.contact.user.email,

      supplierAddress:
        purchaseOrder.contact.city,

      items: purchaseOrder.items.map(
        (item) => ({
          description: item.description,
          price: item.unitPrice,
          quantity: item.quantity,
          total: item.totalPrice,
          unity: item.unity,
        }),
      ),

      subtotal: purchaseOrder.subTotal,

      tva: 19,

      tvaAmount: purchaseOrder.tax,

      total: purchaseOrder.total,
    };
  }

  // =========================================================
  // GENERATE PDF BY ID
  // =========================================================

  async generatePdfById(
    id: number,
    language: string,
  ): Promise<Buffer> {
    const purchaseOrder =
      await this.prisma.purchaseOrder.findUnique({
        where: {
          id,
        },

        include: {
          items: true,

          contact: {
            include: {
              user: true,
            },
          },
        },
      });

    if (!purchaseOrder) {
      throw new Error(
        'Purchase Order not found',
      );
    }

    const data =
      this.mapToTemplate(purchaseOrder);

    return this.generatePdf(
      data,
      language,
    );
  }

  // =========================================================
  // GENERATE PDF
  // =========================================================

  async generatePdf(
    data: any,
    language: string,
  ): Promise<Buffer> {
    // Sélection du template selon la langue
    const templatePath = path.join(
      process.cwd(),
      'src/modules/purchase-order/templates',
      `purchase-order-${language}.hbs`,
    );

    // Lire le template Handlebars
    const htmlTemplate =
      fs.readFileSync(
        templatePath,
        'utf8',
      );

    // Compiler le template
    const template =
      handlebars.compile(
        htmlTemplate,
      );

    // Générer le HTML final
    const html = template(data);

    let browser;

    // =======================================================
    // PRODUCTION
    // =======================================================

    if (process.env.NODE_ENV === 'PROD') {
      browser = await puppeteerCore.launch({
        executablePath:
          await chromium.executablePath(),

        args: [
          ...chromium.args,
          '--no-sandbox',
          '--disable-setuid-sandbox',
        ],

        headless: true,
      });
    }

    // =======================================================
    // DEVELOPMENT
    // =======================================================

    else {
      browser = await puppeteer.launch({
        headless: true,
      });
    }

    try {
      const page =
        await browser.newPage();

      // Charger le HTML
      await page.setContent(html, {
        waitUntil: 'load',
      });

      // Générer le PDF
      const pdf =
        await page.pdf({
          format: 'A4',
          printBackground: true,
        });

      return Buffer.from(pdf);
    }

    finally {
      // Toujours fermer Chromium
      await browser.close();
    }
  }

  // =========================================================
  // CHANGE STATUS
  // =========================================================

  async changeStatus(id: number) {
    const purchaseOrder =
      await this.prisma.purchaseOrder.findUnique({
        where: {
          id,
        },
      });

    if (!purchaseOrder) {
      throw new Error(
        'Purchase Order not found',
      );
    }

    let newStatus;

    // Gestion des transitions de statut
    switch (purchaseOrder.status) {
      case 'PENDING':
        newStatus = 'APPROVED';
        break;

      case 'APPROVED':
        newStatus = 'RECEIVED';
        break;

      case 'RECEIVED':
        newStatus = 'RECEIVED';
        break;

      default:
        throw new Error(
          'Invalid status',
        );
    }

    return await this.prisma.purchaseOrder.update({
      where: {
        id,
      },

      data: {
        status: newStatus,
      },
    });
  }
}