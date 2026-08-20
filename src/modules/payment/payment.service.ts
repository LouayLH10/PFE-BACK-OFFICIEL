// ============================================================
// IMPORTS
// ============================================================

import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import path from 'path';
import * as fs from 'fs';
import * as handlebars from 'handlebars';

// Génération PDF en environnement local
import puppeteer from 'puppeteer';

// Génération PDF en production
import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium';


// ============================================================
// PAYMENT SERVICE
// ============================================================

@Injectable()
export class PaymentService {

  // ==========================================================
  // 1. DEPENDENCY INJECTION
  // ==========================================================

  constructor(
    private prisma: PrismaService,
  ) {}


  // ==========================================================
  // 2. GET PAYMENTS BY USER
  // ==========================================================
  //
  // Récupère uniquement les paiements appartenant aux factures
  // associées au compte du client.
  //
  // Relation :
  // User → Contact → Invoice → Payment
  // ==========================================================

  async findByUser(
    userId: number,
  ) {

    return await this.prisma.payment.findMany({

      where: {

        invoice: {

          contact: {

            userId,

          },

        },

      },

      // Récupération de la facture associée
      include: {

        invoice: true,

      },

      // Les paiements les plus récents en premier
      orderBy: {

        paymentDate: 'desc',

      },

    });
  }


  // ==========================================================
  // 3. MAP PAYMENT DATA
  // ==========================================================
  //
  // Transforme les données provenant de PostgreSQL en données
  // adaptées au template Handlebars.
  // ==========================================================

  private mapPaymentToTemplate(
    payment: any,
  ) {

    return {

      // Génération du numéro du reçu
      receiptNumber: `REC-${payment.id}`,

      // Formatage de la date
      date:
        new Date(
          payment.paymentDate,
        ).toLocaleDateString(),

      // Informations du client
      clientName:
        payment.invoice?.contact?.user?.name
        || 'N/A',

      clientEmail:
        payment.invoice?.contact?.user?.email
        || 'N/A',

      // Référence de la facture
      invoiceRef:
        payment.invoice?.reference,

      // Informations du paiement
      amount:
        payment.amount,

      method:
        payment.method,

      status:
        payment.status,
    };
  }


  // ==========================================================
  // 4. GENERATE PDF BY PAYMENT ID
  // ==========================================================
  //
  // Cette méthode :
  // 1. récupère le paiement
  // 2. récupère les données du client et de la facture
  // 3. prépare les données du template
  // 4. lance la génération du PDF
  // ==========================================================

  async generatePdfById(
    id: number,
    language: string,
  ): Promise<Buffer> {

    // --------------------------------------------------------
    // 4.1 Récupération du paiement
    // --------------------------------------------------------

    const payment =
      await this.prisma.payment.findUnique({

        where: {
          id,
        },

        // Récupération des relations nécessaires
        include: {

          invoice: {

            include: {

              contact: {

                include: {

                  user: true,

                },

              },

            },

          },

        },

      });


    // --------------------------------------------------------
    // 4.2 Vérification de l'existence
    // --------------------------------------------------------

    if (!payment) {

      throw new Error(
        'Payment not found',
      );

    }


    // --------------------------------------------------------
    // 4.3 Transformation des données
    // --------------------------------------------------------

    const data =
      this.mapPaymentToTemplate(
        payment,
      );


    // --------------------------------------------------------
    // 4.4 Génération du PDF
    // --------------------------------------------------------

    return this.generatePdf(
      data,
      language,
    );
  }


  // ==========================================================
  // 5. GENERATE PAYMENT PDF
  // ==========================================================
  //
  // Génère le reçu PDF à partir d'un template Handlebars.
  //
  // Deux templates sont disponibles :
  // - receipt-fr.hbs
  // - receipt-en.hbs
  // ==========================================================

  async generatePdf(
    data: any,
    language: string,
  ): Promise<Buffer> {

    // --------------------------------------------------------
    // 5.1 Sélection du template selon la langue
    // --------------------------------------------------------

    const templateName =
      language === 'fr'
        ? 'receipt-fr.hbs'
        : 'receipt-en.hbs';


    // --------------------------------------------------------
    // 5.2 Localisation du template
    // --------------------------------------------------------

    const templatePath =
      path.join(
        process.cwd(),
        'src/modules/payment/templates',
        templateName,
      );


    // --------------------------------------------------------
    // 5.3 Lecture du template HTML
    // --------------------------------------------------------

    const templateHtml =
      fs.readFileSync(
        templatePath,
        'utf8',
      );


    // --------------------------------------------------------
    // 5.4 Compilation du template Handlebars
    // --------------------------------------------------------

    const template =
      handlebars.compile(
        templateHtml,
      );


    // Génération du HTML final
    const html =
      template(data);


    // ========================================================
    // 6. INITIALISATION DU NAVIGATEUR
    // ========================================================

    let browser;


    // --------------------------------------------------------
    // 6.1 Production / Render
    // --------------------------------------------------------
    //
    // puppeteer-core ne télécharge pas son propre navigateur.
    // Chromium fourni par @sparticuz/chromium est utilisé.
    // --------------------------------------------------------

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


    } else {

      // ------------------------------------------------------
      // 6.2 Développement local
      // ------------------------------------------------------
      //
      // Puppeteer utilise son navigateur Chromium local.
      // ------------------------------------------------------

      browser =
        await puppeteer.launch({

          headless: true,

        });
    }


    // ========================================================
    // 7. HTML → PDF
    // ========================================================

    try {

      // ------------------------------------------------------
      // 7.1 Création d'une nouvelle page
      // ------------------------------------------------------

      const page =
        await browser.newPage();


      // ------------------------------------------------------
      // 7.2 Chargement du HTML
      // ------------------------------------------------------

      await page.setContent(
        html,
        {
          waitUntil: 'load',
        },
      );


      // ------------------------------------------------------
      // 7.3 Génération du PDF
      // ------------------------------------------------------

      const pdf =
        await page.pdf({

          format: 'A4',

          // Conserver les couleurs et styles CSS
          printBackground: true,

        });


      // Conversion en Buffer
      return Buffer.from(pdf);


    } finally {

      // ======================================================
      // 8. FERMETURE DU NAVIGATEUR
      // ======================================================

      // Important pour libérer les ressources serveur
      await browser.close();
    }
  }
}