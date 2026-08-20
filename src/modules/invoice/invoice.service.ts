import { Injectable } from '@nestjs/common';

import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

import { PrismaService } from 'src/prisma/prisma.service';

import path from 'path';
import * as fs from 'fs';
import * as handlebars from 'handlebars';

import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer';
import puppeteerCore from 'puppeteer-core';


@Injectable()
export class InvoiceService {

  constructor(
    private prisma: PrismaService,
  ) {}


  // ============================================================
  // 1. CRÉATION D'UNE FACTURE
  // ============================================================
  // Crée une nouvelle facture et génère automatiquement
  // sa référence sous le format INV-AAAA-XXXX.
  // ============================================================

  async create(
    createInvoiceDto: CreateInvoiceDto,
  ) {

    const {
      contactId,
      projectId,
      ...data
    } = createInvoiceDto;


    // ------------------------------------------------------------
    // 1.1 Génération de la référence
    // ------------------------------------------------------------

    const year =
      new Date().getFullYear();

    const lastInvoice =
      await this.prisma.invoice.findFirst({
        orderBy: {
          id: 'desc',
        },
      });

    let nextNumber = 1;

    if (lastInvoice?.reference) {

      const lastNumber =
        parseInt(
          lastInvoice.reference.split('-')[2],
        );

      nextNumber =
        lastNumber + 1;
    }

    const reference =
      `INV-${year}-${String(nextNumber).padStart(4, '0')}`;


    // ------------------------------------------------------------
    // 1.2 Création de la facture avec Prisma
    // ------------------------------------------------------------

    return await this.prisma.invoice.create({

      data: {

        ...data,

        // Initialisation des montants
        subTotal: 0,
        taxTotal: 0,
        total: 0,
        balanceDue: 0,
        discountTotal: 0,

        reference,

        // Association avec le contact
        contact: {
          connect: {
            id: contactId,
          },
        },

        // Association optionnelle avec un projet
        ...(projectId && {
          project: {
            connect: {
              id: projectId,
            },
          },
        }),
      },

      include: {
        contact: true,
        project: true,
      },
    });
  }


  // ============================================================
  // 2. RÉCUPÉRATION DE TOUTES LES FACTURES
  // ============================================================

  async findAll() {

    return await this.prisma.invoice.findMany({

      include: {
        contact: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }


  // ============================================================
  // 3. RÉCUPÉRATION D'UNE FACTURE PAR SON ID
  // ============================================================

  async findOne(
    id: number,
  ) {

    return await this.prisma.invoice.findUnique({

      where: {
        id,
      },

      include: {
        contact: true,
      },
    });
  }


  // ============================================================
  // 4. MODIFICATION D'UNE FACTURE
  // ============================================================

  async update(
    id: number,
    updateInvoiceDto: UpdateInvoiceDto,
  ) {

    return await this.prisma.invoice.update({

      where: {
        id,
      },

      data: updateInvoiceDto,
    });
  }


  // ============================================================
  // 5. SUPPRESSION D'UNE FACTURE
  // ============================================================

  async remove(
    id: number,
  ) {

    return await this.prisma.invoice.delete({

      where: {
        id,
      },
    });
  }


  // ============================================================
  // 6. RÉCUPÉRATION DES FACTURES D'UN UTILISATEUR
  // ============================================================
  // Permet de récupérer uniquement les factures associées
  // au contact appartenant à l'utilisateur connecté.
  // ============================================================

  async findByContact(
    userId: number,
  ) {

    return await this.prisma.invoice.findMany({

      where: {

        contact: {
          userId,
        },
      },

      include: {

        contact: {

          include: {

            user: {

              // Retourner uniquement les informations
              // nécessaires du client
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },

        // Récupération des lignes de facture
        invoiceLignes: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }


  // ============================================================
  // 7. CHANGEMENT DU STATUT D'UNE FACTURE
  // ============================================================
  // Gestion du cycle de vie :
  //
  // DRAFT → SENT → PAID
  //
  // Lorsqu'une facture devient PAID, un paiement
  // est automatiquement créé.
  // ============================================================

  async changeStatus(
    id: number,
  ) {

    // ------------------------------------------------------------
    // 7.1 Récupération de la facture
    // ------------------------------------------------------------

    const invoice =
      await this.prisma.invoice.findUnique({
        where: {
          id,
        },
      });

    if (!invoice) {
      throw new Error(
        'Invoice not found',
      );
    }


    // ------------------------------------------------------------
    // 7.2 Détermination du nouveau statut
    // ------------------------------------------------------------

    let newStatus;

    switch (invoice.status) {

      case 'DRAFT':

        newStatus = 'SENT';

        break;


      case 'SENT':

        newStatus = 'PAID';

        break;


      default:

        throw new Error(
          'Invalid status',
        );
    }


    // ------------------------------------------------------------
    // 7.3 Mise à jour du statut
    // ------------------------------------------------------------

    const updatedInvoice =
      await this.prisma.invoice.update({

        where: {
          id,
        },

        data: {
          status: newStatus,
        },
      });


    // ------------------------------------------------------------
    // 7.4 Création automatique du paiement
    // ------------------------------------------------------------
    // Si la facture est totalement payée,
    // le système crée automatiquement le paiement.
    // ------------------------------------------------------------

    if (newStatus === 'PAID') {

      await this.prisma.payment.create({

        data: {

          amount:
            updatedInvoice.total,

          status:
            'SUCCESS',

          invoice: {
            connect: {
              id: updatedInvoice.id,
            },
          },
        },
      });
    }


    return updatedInvoice;
  }


  // ============================================================
  // 8. PRÉPARATION DES DONNÉES POUR LE TEMPLATE PDF
  // ============================================================
  // Transforme les données Prisma en données compatibles
  // avec le template Handlebars.
  // ============================================================

  private mapInvoiceToTemplate(
    invoiceFromDB: any,
  ) {

    return {

      numero:
        `${invoiceFromDB.reference}`,

      date:
        new Date(
          invoiceFromDB.createdAt,
        ).toLocaleDateString(),

      clientName:
        invoiceFromDB.contact.user.name,

      clientEmail:
        invoiceFromDB.contact.user.email,

      clientAdresse:
        invoiceFromDB.contact.city,

      items:
        invoiceFromDB.invoiceLignes.map(
          (line) => ({

            description:
              line.description,

            price:
              line.unitPrice,

            quantity:
              line.quantity,

            total:
              line.totalPrice,

            unity:
              line.unity,
          }),
        ),

      subtotal:
        invoiceFromDB.subTotal,

      tva:
        19,

      tvaAmount:
        invoiceFromDB.taxTotal,

      total:
        invoiceFromDB.total,
    };
  }


  // ============================================================
  // 9. GÉNÉRATION DU PDF À PARTIR DE L'ID
  // ============================================================
  // Récupère la facture depuis PostgreSQL,
  // prépare les données puis génère le PDF
  // dans la langue demandée.
  // ============================================================

  async generatePdfById(
    id: number,
    language: string,
  ): Promise<Buffer> {

    // ------------------------------------------------------------
    // 9.1 Récupération de la facture
    // ------------------------------------------------------------

    const invoice =
      await this.prisma.invoice.findUnique({

        where: {
          id,
        },

        include: {

          // Lignes de facture
          invoiceLignes: true,

          // Informations du client
          contact: {

            include: {
              user: true,
            },
          },
        },
      });


    if (!invoice) {

      throw new Error(
        'Invoice not found',
      );
    }


    // ------------------------------------------------------------
    // 9.2 Transformation des données
    // ------------------------------------------------------------

    const data =
      this.mapInvoiceToTemplate(
        invoice,
      );


    // ------------------------------------------------------------
    // 9.3 Génération du PDF
    // ------------------------------------------------------------

    return this.generatePdf(
      data,
      language,
    );
  }


  // ============================================================
  // 10. GÉNÉRATION DU PDF AVEC HANDLEBARS + PUPPETEER
  // ============================================================
  // Deux environnements sont supportés :
  //
  // LOCAL:
  //   Puppeteer utilise Chromium installé localement.
  //
  // PRODUCTION:
  //   @sparticuz/chromium fournit Chromium compatible
  //   avec l'environnement Render/serverless.
  // ============================================================

  async generatePdf(
    data: any,
    language: string,
  ): Promise<Buffer> {


    // ------------------------------------------------------------
    // 10.1 Sélection du template selon la langue
    // ------------------------------------------------------------

    const templateName =
      language === 'fr'
        ? 'invoice-fr.hbs'
        : 'invoice-en.hbs';


    // ------------------------------------------------------------
    // 10.2 Chargement du template Handlebars
    // ------------------------------------------------------------

    const templatePath =
      path.join(
        process.cwd(),
        'src/modules/invoice/templates',
        templateName,
      );

    const templateHtml =
      fs.readFileSync(
        templatePath,
        'utf8',
      );


    // ------------------------------------------------------------
    // 10.3 Compilation du template
    // ------------------------------------------------------------

    const template =
      handlebars.compile(
        templateHtml,
      );

    const html =
      template(data);


    // ------------------------------------------------------------
    // 10.4 Lancement du navigateur
    // ------------------------------------------------------------

    let browser;


    // ------------------------------------------------------------
    // Production - Render
    // ------------------------------------------------------------

    if (
      process.env.NODE_ENV === 'PROD'
    ) {

      browser =
        await puppeteerCore.launch({

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

    // ------------------------------------------------------------
    // Environnement local
    // ------------------------------------------------------------

    else {

      browser =
        await puppeteer.launch({

          headless: true,

        });
    }


    // ------------------------------------------------------------
    // 10.5 Création du PDF
    // ------------------------------------------------------------

    try {

      const page =
        await browser.newPage();


      // Charger le HTML généré
      await page.setContent(
        html,
        {
          waitUntil: 'load',
        },
      );


      // Générer le PDF au format A4
      const pdf =
        await page.pdf({

          format: 'A4',

          printBackground: true,

        });


      return Buffer.from(pdf);

    }

    // ------------------------------------------------------------
    // 10.6 Fermeture du navigateur
    // ------------------------------------------------------------

    finally {

      await browser.close();
    }
  }
}