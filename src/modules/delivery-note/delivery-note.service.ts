import { Injectable } from '@nestjs/common';

import path from 'path';
import * as fs from 'fs';
import * as handlebars from 'handlebars';

import puppeteer from 'puppeteer';
import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DeliveryNoteService {
  constructor(private prisma: PrismaService) {}

  // ============================================================
  // 1. CRÉATION D'UN BON DE LIVRAISON
  // ============================================================

  async create(dto: any) {
    const { contactId, deliveryDate, ...data } = dto;

    // Récupération de l'année courante
    const year = new Date().getFullYear();

    // Récupération du dernier bon de livraison
    const last = await this.prisma.deliveryNote.findFirst({
      orderBy: { id: 'desc' },
    });

    // Génération du numéro séquentiel
    let nextNumber = 1;

    if (last?.reference) {
      const lastNumber = parseInt(
        last.reference.split('-')[2],
      );

      nextNumber = lastNumber + 1;
    }

    // Construction de la référence
    const reference = `DN-${year}-${String(nextNumber).padStart(4, '0')}`;

    // Enregistrement en base de données
    return await this.prisma.deliveryNote.create({
      data: {
        ...data,
        reference,
        deliveryDate: new Date(deliveryDate),

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

  // ============================================================
  // 2. RÉCUPÉRATION DE TOUS LES BONS DE LIVRAISON
  // ============================================================

  async findAll() {
    return this.prisma.deliveryNote.findMany({
      include: {
        contact: true,
        items: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // ============================================================
  // 3. RÉCUPÉRATION D'UN BON DE LIVRAISON PAR SON ID
  // ============================================================

  async findOne(id: number) {
    return this.prisma.deliveryNote.findUnique({
      where: { id },

      include: {
        contact: {
          include: {
            user: true,
          },
        },

        items: true,
      },
    });
  }

  // ============================================================
  // 4. SUPPRESSION D'UN BON DE LIVRAISON
  // ============================================================

  async remove(id: number) {
    return this.prisma.deliveryNote.delete({
      where: { id },
    });
  }

  // ============================================================
  // 5. RÉCUPÉRATION DES BONS DE LIVRAISON D'UN UTILISATEUR
  // ============================================================

  async findByUser(userId: number) {
    return this.prisma.deliveryNote.findMany({
      where: {
        contact: {
          userId,
        },
      },

      include: {
        items: true,

        contact: {
          include: {
            user: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // ============================================================
  // 6. PRÉPARATION DES DONNÉES POUR LE TEMPLATE PDF
  // ============================================================

  private mapDeliveryNoteToTemplate(dn: any) {
    return {
      numero: dn.reference,

      date: new Date(
        dn.deliveryDate,
      ).toLocaleDateString(),

      // Informations du client
      clientName: dn.contact?.user?.name ?? 'N/A',
      clientEmail: dn.contact?.user?.email ?? 'N/A',
      clientPhone: dn.contact?.phone ?? '',

      // Informations du bon de livraison
      location: dn.location,
      status: dn.status,

      // Liste des articles
      items: dn.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unity: item.unity,
      })),
    };
  }

  // ============================================================
  // 7. GÉNÉRATION DU PDF À PARTIR D'UN ID
  // ============================================================

  async generatePdfById(
    id: number,
    language: string,
  ): Promise<Buffer> {

    // Recherche du bon de livraison
    const dn =
      await this.prisma.deliveryNote.findUnique({
        where: { id },

        include: {
          items: true,

          contact: {
            include: {
              user: true,
            },
          },
        },
      });

    // Vérification de l'existence
    if (!dn) {
      throw new Error(
        'Delivery Note not found',
      );
    }

    // Transformation des données
    const data =
      this.mapDeliveryNoteToTemplate(dn);

    // Génération du PDF selon la langue
    return this.generatePdf(
      data,
      language,
    );
  }

  // ============================================================
  // 8. GÉNÉRATION DU PDF
  // ============================================================

  async generatePdf(
    data: any,
    language: string,
  ): Promise<Buffer> {

    // ----------------------------------------------------------
    // 8.1 Sélection du template selon la langue
    // ----------------------------------------------------------

    const templateName =
      language === 'fr'
        ? 'delivery-note-fr.hbs'
        : 'delivery-note-en.hbs';

    const templatePath = path.join(
      process.cwd(),
      'src/modules/delivery-note/templates',
      templateName,
    );

    // ----------------------------------------------------------
    // 8.2 Chargement et compilation du template
    // ----------------------------------------------------------

    const templateHtml =
      fs.readFileSync(
        templatePath,
        'utf8',
      );

    const template =
      handlebars.compile(
        templateHtml,
      );

    // Génération du HTML final
    const html =
      template(data);

    let browser;

    // ----------------------------------------------------------
    // 8.3 Sélection du moteur Chromium
    // ----------------------------------------------------------

    if (process.env.NODE_ENV === 'PROD') {

      // En production : Chromium optimisé pour Render
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

      // En développement local :
      // utilisation de Puppeteer avec Chromium local
      browser =
        await puppeteer.launch({
          headless: true,
        });
    }

    // ----------------------------------------------------------
    // 8.4 Conversion HTML → PDF
    // ----------------------------------------------------------

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

    } finally {

      // Fermeture du navigateur
      await browser.close();
    }
  }
}