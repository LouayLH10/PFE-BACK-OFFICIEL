// ============================================================
// IMPORTS
// ============================================================

import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import * as Tesseract from 'tesseract.js';
import * as fs from 'fs';
import * as path from 'path';

import { execFile } from 'child_process';
import { promisify } from 'util';

import { AiService } from '../IA/ai/ai.service';
import { InvoiceService } from '../invoice/invoice.service';
import { QuoteService } from '../quote/quote.service';
import { ProjectService } from '../project/project.service';
import { PurchaseOrderService } from '../purchase-order/purchase-order.service';


// Conversion de execFile en fonction compatible avec async/await
const execFileAsync = promisify(execFile);


// ============================================================
// OCR SERVICE
// ============================================================

@Injectable()
export class OcrService {

  // ==========================================================
  // DEPENDENCIES INJECTION
  // ==========================================================

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,

    // Services utilisés pour générer les documents PDF
    private invoiceService: InvoiceService,
    private quoteService: QuoteService,
    private projectService: ProjectService,
    private orderService: PurchaseOrderService,
  ) {}


  // ==========================================================
  // 1. MAIN OCR PROCESS
  // ==========================================================
  // Cette méthode constitue le processus principal d'analyse.
  //
  // Étapes :
  // 1. Génération du PDF
  // 2. Conversion PDF → texte
  // 3. Analyse du texte par l'IA
  // 4. Génération des insights
  // 5. Calcul du score de confiance
  // 6. Génération du rapport exécutif
  // 7. Sauvegarde des résultats en base
  // ==========================================================

  async processDocument(
    id: number,
    documentType: string,
    contactId: number,
  ) {

    // --------------------------------------------------------
    // 1.1 Génération du document PDF
    // --------------------------------------------------------

    let pdfBuffer: Buffer;
    let fileName = '';

    switch (documentType) {

      case 'invoice':

        pdfBuffer =
          await this.invoiceService
            .generatePdfById(id, 'en');

        fileName = `invoice-${id}.pdf`;

        break;


      case 'quote':

        pdfBuffer =
          await this.quoteService
            .generatePdfById(id, 'en');

        fileName = `quote-${id}.pdf`;

        break;


      case 'project':

        pdfBuffer =
          await this.projectService
            .generatePdfById(id, 'en');

        fileName = `project-${id}.pdf`;

        break;


      case 'purchase_order':

        pdfBuffer =
          await this.orderService
            .generatePdfById(id, 'en');

        fileName = `purchase-order-${id}.pdf`;

        break;


      default:

        throw new BadRequestException(
          'Unsupported document type',
        );
    }


    // --------------------------------------------------------
    // 1.2 Création du dossier temporaire
    // --------------------------------------------------------

    const tempDir = path.join(
      process.cwd(),
      'uploads',
    );

    if (!fs.existsSync(tempDir)) {

      fs.mkdirSync(tempDir, {
        recursive: true,
      });

    }


    // --------------------------------------------------------
    // 1.3 Sauvegarde temporaire du PDF
    // --------------------------------------------------------

    const filePath = path.join(
      tempDir,
      fileName,
    );

    fs.writeFileSync(
      filePath,
      pdfBuffer,
    );


    // --------------------------------------------------------
    // 1.4 Extraction du texte depuis le PDF
    // --------------------------------------------------------

    const extractedText =
      await this.extractPdfText(filePath);


    // --------------------------------------------------------
    // 1.5 Analyse du document avec l'intelligence artificielle
    // --------------------------------------------------------

    // Résumé rapide du contenu OCR
    const aiSummary =
      extractedText.substring(0, 300);


    // Extraction structurée des informations
    const extractedJson =
      await this.aiService.extractDocument(
        extractedText,
        documentType,
      );


    // --------------------------------------------------------
    // 1.6 Génération des insights métier
    // --------------------------------------------------------

    const aiInsights =
      await this.aiService.generateInsights(
        extractedJson,
        documentType,
      );


    // --------------------------------------------------------
    // 1.7 Calcul du niveau de confiance
    // --------------------------------------------------------

    const confidenceScore =
      this.aiService.calculateConfidence(
        extractedJson,
      );


    // --------------------------------------------------------
    // 1.8 Génération du rapport exécutif
    // --------------------------------------------------------

    const executiveReport =
      await this.aiService.generateExecutiveReport(
        extractedJson,
        aiInsights,
        documentType,
      );


    // --------------------------------------------------------
    // 1.9 Sauvegarde des résultats OCR
    // --------------------------------------------------------

    const document =
      await this.prisma.ocrDocument.create({

        data: {

          fileName,
          originalName: fileName,

          mimeType: 'application/pdf',

          fileUrl: `/uploads/${fileName}`,

          documentType,

          // Texte obtenu par OCR
          extractedText,

          // Résumé généré par l'IA
          aiSummary,

          // Données structurées
          extractedJson,

          // Analyse des risques
          aiInsights,

          // Rapport exécutif
          aiExecutiveReport:
            executiveReport,

          // Relation avec le contact
          contactId,

          // Score de confiance
          confidenceScore,

          status: 'COMPLETED',

          // Association avec le document original
          invoiceId:
            documentType === 'invoice'
              ? id
              : null,

          quoteId:
            documentType === 'quote'
              ? id
              : null,

          projectId:
            documentType === 'project'
              ? id
              : null,
        },
      });


    // Retourner le résultat complet
    return document;
  }


  // ==========================================================
  // 2. PDF → IMAGE → OCR
  // ==========================================================
  //
  // Cette méthode transforme le PDF en images puis applique
  // Tesseract OCR sur chaque page.
  //
  // En production :
  // PDF → PNG avec pdftoppm / Poppler
  //
  // En développement :
  // PDF → PNG avec pdf-poppler
  // ==========================================================

  async extractPdfText(
    pdfPath: string,
  ): Promise<string> {

    // --------------------------------------------------------
    // 2.1 Création du dossier temporaire OCR
    // --------------------------------------------------------

    const outputDir =
      path.join(
        process.cwd(),
        'uploads',
        'ocr-temp',
      );


    if (!fs.existsSync(outputDir)) {

      fs.mkdirSync(outputDir, {
        recursive: true,
      });

    }


    // Préfixe unique pour identifier les images générées
    const prefix =
      `pdf-${Date.now()}`;


    try {

      // ------------------------------------------------------
      // 2.2 Conversion PDF → PNG
      // ------------------------------------------------------

      if (
        process.env.NODE_ENV === 'production'
      ) {

        // ====================================================
        // PRODUCTION / RENDER
        // ====================================================
        //
        // Utilisation de pdftoppm fourni par Poppler.
        // Cette solution est adaptée à l'environnement Linux
        // utilisé par Render.
        // ====================================================

        console.log(
          'Production environment detected: using pdftoppm',
        );


        const outputPrefix =
          path.join(
            outputDir,
            prefix,
          );


        await execFileAsync(
          'pdftoppm',
          [
            '-png',
            '-r',
            '150',
            pdfPath,
            outputPrefix,
          ],
        );


      } else {

        // ====================================================
        // DEVELOPMENT / LOCAL
        // ====================================================
        //
        // En environnement local Windows, utilisation de
        // pdf-poppler.
        //
        // Le module est chargé uniquement ici afin d'éviter
        // les problèmes lors du déploiement sur Render.
        // ====================================================

        console.log(
          'Development environment detected: using pdf-poppler',
        );


        const pdfPoppler =
          require('pdf-poppler');


        const opts = {

          format: 'png',

          out_dir: outputDir,

          out_prefix: prefix,

          page: null,

        };


        await pdfPoppler.convert(
          pdfPath,
          opts,
        );
      }


      // ------------------------------------------------------
      // 2.3 Récupération des images générées
      // ------------------------------------------------------

      const files =
        fs.readdirSync(outputDir);


      const imageFiles =
        files
          .filter(
            (file) =>
              file.startsWith(prefix) &&
              file.endsWith('.png'),
          )
          .sort();


      if (imageFiles.length === 0) {

        throw new Error(
          'No PNG images were generated from the PDF.',
        );

      }


      // ------------------------------------------------------
      // 2.4 Application de Tesseract OCR
      // ------------------------------------------------------

      let fullText = '';


      for (
        const image of imageFiles
      ) {

        const imagePath =
          path.join(
            outputDir,
            image,
          );


        console.log(
          `OCR processing: ${image}`,
        );


        // Reconnaissance du texte de chaque page
        const result =
          await Tesseract.recognize(
            imagePath,
            'eng',
          );


        // Ajouter le texte de la page
        fullText +=
          '\n' +
          result.data.text;
      }


      return fullText.trim();


    } finally {

      // ------------------------------------------------------
      // 2.5 Nettoyage des fichiers temporaires
      // ------------------------------------------------------

      if (fs.existsSync(outputDir)) {

        const files =
          fs.readdirSync(outputDir);


        for (
          const file of files
        ) {

          if (
            file.startsWith(prefix) &&
            file.endsWith('.png')
          ) {

            try {

              fs.unlinkSync(
                path.join(
                  outputDir,
                  file,
                ),
              );

            } catch (error) {

              console.error(
                `Unable to delete temporary file: ${file}`,
                error,
              );

            }
          }
        }
      }
    }
  }


  // ==========================================================
  // 3. EXTRACTION DES DONNÉES D'UNE FACTURE
  // ==========================================================
  //
  // Extraction simple basée sur des expressions régulières.
  // Cette méthode permet de récupérer certaines informations
  // directement depuis le texte OCR.
  // ==========================================================

  extractInvoiceData(text: string) {

    // --------------------------------------------------------
    // Numéro de facture
    // --------------------------------------------------------

    const invoiceNumber =
      text.match(
        /INV-\d{4}-\d+/,
      )?.[0];


    // --------------------------------------------------------
    // Date
    // --------------------------------------------------------

    const date =
      text.match(
        /\d{2}\/\d{2}\/\d{4}/,
      )?.[0];


    // --------------------------------------------------------
    // Adresse email
    // --------------------------------------------------------

    const email =
      text.match(
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/,
      )?.[0];


    // --------------------------------------------------------
    // Total
    // --------------------------------------------------------

    const total =
      text.match(
        /Total\s+(\d+)/i,
      )?.[1];


    // --------------------------------------------------------
    // Sous-total
    // --------------------------------------------------------

    const subtotal =
      text.match(
        /Sub Total\s+(\d+)/i,
      )?.[1];


    // --------------------------------------------------------
    // TVA
    // --------------------------------------------------------

    const tax =
      text.match(
        /TVA.*?(\d+)/i,
      )?.[1];


    // --------------------------------------------------------
    // Résultat
    // --------------------------------------------------------

    return {

      invoiceNumber,

      date,

      email,

      subtotal:
        subtotal
          ? Number(subtotal)
          : null,

      tax:
        tax
          ? Number(tax)
          : null,

      total:
        total
          ? Number(total)
          : null,
    };
  }


  // ==========================================================
  // 4. RÉCUPÉRATION DES DOCUMENTS PAR UTILISATEUR
  // ==========================================================

  async findByUser(
    userId: number,
  ) {

    return await this.prisma.ocrDocument.findMany({

      where: {

        contact: {
          userId,
        },

      },

      orderBy: {
        createdAt: 'desc',
      },

    });
  }


  // ==========================================================
  // 5. VÉRIFICATION DE L'EXISTENCE D'UNE ANALYSE OCR
  // ==========================================================
  //
  // Permet de vérifier si un document donné a déjà été analysé.
  // ==========================================================

  async verifyExistence(
    id: number,
    documentType: string,
  ) {

    const document =
      await this.prisma.ocrDocument.findFirst({

        where: {

          documentType,

          ...(documentType === 'invoice' && {
            invoiceId: id,
          }),

          ...(documentType === 'quote' && {
            quoteId: id,
          }),

          ...(documentType === 'project' && {
            projectId: id,
          }),

          ...(documentType === 'purchaseOrder' && {
            purchaseOrderId: id,
          }),

          ...(documentType === 'deliveryNote' && {
            deliveryNoteId: id,
          }),

        },

      });


    return {

      analyzed: !!document,

      document,

    };
  }
}