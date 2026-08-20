import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';

import path from 'path';
import * as fs from 'fs';
import * as handlebars from 'handlebars';

import puppeteer from 'puppeteer';
import chromium from '@sparticuz/chromium';

@Injectable()
export class QuoteService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================
  // CREATE
  // =========================================================

  async create(createQuoteDto: CreateQuoteDto) {
    const { contactId, ...data } = createQuoteDto;

    // Génération de la référence
    const year = new Date().getFullYear();

    const lastQuote =
      await this.prisma.quote.findFirst({
        orderBy: {
          id: 'desc',
        },
      });

    let nextNumber = 1;

    if (lastQuote?.reference) {
      const lastNumber = parseInt(
        lastQuote.reference.split('-')[2],
      );

      nextNumber = lastNumber + 1;
    }

    // Format : DEV-2026-0001
    const reference =
      `DEV-${year}-${String(nextNumber).padStart(4, '0')}`;

    return await this.prisma.quote.create({
      data: {
        ...data,
        reference,
        amount: 0,
        totalAmount: 0,

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
    return await this.prisma.quote.findMany({
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
    return await this.prisma.quote.findUnique({
      where: {
        id,
      },

      include: {
        contact: true,
      },
    });
  }

  // =========================================================
  // UPDATE
  // =========================================================

  async update(
    id: number,
    updateQuoteDto: UpdateQuoteDto,
  ) {
    const {
      contactId,
      ...data
    } = updateQuoteDto;

    return await this.prisma.quote.update({
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
    return await this.prisma.quote.delete({
      where: {
        id,
      },
    });
  }

  // =========================================================
  // FIND QUOTES BY USER
  // =========================================================

  async findByUser(userId: number) {
    return await this.prisma.quote.findMany({
      where: {
        contact: {
          userId,
        },
      },

      include: {
        // Lignes du devis
        quoteligne: true,

        // Informations du client
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
  // MAP QUOTE TO PDF TEMPLATE
  // =========================================================

  private mapQuoteToTemplate(
    quoteFromDB: any,
  ) {
    return {
      numero: quoteFromDB.reference,

      date: new Date(
        quoteFromDB.createdAt,
      ).toLocaleDateString(),

      clientName:
        quoteFromDB.contact.user.name,

      clientEmail:
        quoteFromDB.contact.user.email,

      clientAdresse:
        quoteFromDB.contact.city,

      items:
        quoteFromDB.quoteligne.map(
          (line) => ({
            description: line.description,
            price: line.unitPrice,
            quantity: line.quantity,
            total: line.totalPrice,
            unity: line.unity,
          }),
        ),

      subtotal:
        quoteFromDB.amount,

      tva:
        quoteFromDB.tva,

      tvaAmount:
        (quoteFromDB.amount *
          quoteFromDB.tva) /
        100,

      total:
        quoteFromDB.totalAmount,
    };
  }

  // =========================================================
  // GENERATE PDF BY ID
  // =========================================================

  async generatePdfById(
    id: number,
    language: string,
  ): Promise<Buffer> {
    const quote =
      await this.prisma.quote.findUnique({
        where: {
          id,
        },

        include: {
          quoteligne: true,

          contact: {
            include: {
              user: true,
            },
          },
        },
      });

    if (!quote) {
      throw new NotFoundException(
        'Quote not found',
      );
    }

    const data =
      this.mapQuoteToTemplate(quote);

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
    const templatePath =
      path.join(
        process.cwd(),
        'src/modules/quote/templates',
        `quote-${language}.hbs`,
      );

    // Lecture du template Handlebars
    const templateHtml =
      fs.readFileSync(
        templatePath,
        'utf8',
      );

    // Compilation du template
    const template =
      handlebars.compile(
        templateHtml,
      );

    // Génération du HTML
    const html =
      template(data);

    let browser;

    // Production
    if (
      process.env.NODE_ENV === 'PROD'
    ) {
      browser =
        await puppeteer.launch({
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

    // Développement local
    else {
      browser =
        await puppeteer.launch({
          headless: true,
        });
    }

    try {
      const page =
        await browser.newPage();

      await page.setContent(
        html,
        {
          waitUntil: 'load',
        },
      );

      const pdf =
        await page.pdf({
          format: 'A4',
          printBackground: true,
        });

      return Buffer.from(pdf);
    }

    finally {
      await browser.close();
    }
  }

  // =========================================================
  // CHANGE STATUS
  // =========================================================

  async changeStatus(id: number) {
    // Récupération du devis
    const quote =
      await this.prisma.quote.findUnique({
        where: {
          id,
        },
      });

    if (!quote) {
      throw new NotFoundException(
        'Quote not found',
      );
    }

    let newStatus;

    // Transition d'état
    switch (quote.status) {
      case 'ON_HOLD':
        newStatus = 'IN_PROGRESS';
        break;

      case 'IN_PROGRESS':
        newStatus = 'READY';
        break;

      case 'READY':
        newStatus = 'READY';
        break;

      default:
        throw new Error(
          'Invalid status',
        );
    }

    return await this.prisma.quote.update({
      where: {
        id,
      },

      data: {
        status: newStatus,
      },
    });
  }

  // =========================================================
  // BUILD VOICE QUOTE TEMPLATE
  // =========================================================

  private buildQuoteTemplate(
    contact: any,
    items: any[],
  ) {
    // Calcul du sous-total
    const subTotal =
      items.reduce(
        (sum, item) =>
          sum + item.total,
        0,
      );

    // TVA
    const taxRate = 19;

    const taxTotal =
      (subTotal * taxRate) / 100;

    // Total TTC
    const total =
      subTotal + taxTotal;

    return {
      numero: `VOICE-${Date.now()}`,

      date:
        new Date().toLocaleDateString(),

      clientName:
        contact.user.name,

      clientEmail:
        contact.user.email,

      clientAdresse:
        contact.city,

      items,

      subtotal:
        subTotal,

      tva:
        taxRate,

      tvaAmount:
        taxTotal,

      total,
    };
  }

  // =========================================================
  // CREATE QUOTE FROM VOICE ASSISTANT
  // =========================================================

  async createVoiceQuote(
    userId: number,
    language: string,
    products: {
      productId: number;
      quantity: number;
    }[],
  ) {
    // Récupération du contact
    const contact =
      await this.prisma.contact.findUnique({
        where: {
          id: userId,
        },

        include: {
          user: true,
        },
      });

    if (!contact) {
      throw new NotFoundException(
        'Contact not found',
      );
    }

    // Liste des lignes du devis
    const items: {
      description: string;
      quantity: number;
      price: number;
      total: number;
      unity: string;
    }[] = [];

    let subTotal = 0;

    // Recherche des produits
    for (const item of products) {
      const product =
        await this.prisma.product.findUnique({
          where: {
            id: item.productId,
          },
        });

      // Produit introuvable
      if (!product) {
        continue;
      }

      // Calcul ligne
      const lineTotal =
        product.unitPrice *
        item.quantity;

      subTotal += lineTotal;

      items.push({
        description:
          product.name,

        quantity:
          item.quantity,

        price:
          product.unitPrice,

        total:
          lineTotal,

        unity:
          product.unit,
      });
    }

    // Calcul TVA
    const taxRate = 19;

    const taxTotal =
      (subTotal * taxRate) / 100;

    // Total TTC
    const total =
      subTotal + taxTotal;

    // Préparation des données PDF
    const template =
      this.buildQuoteTemplate(
        contact,
        items,
      );

    // Génération du PDF
    return this.generatePdf(
      template,
      language,
    );
  }
}