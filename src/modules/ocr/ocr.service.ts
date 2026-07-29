// ocr.service.ts

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

const execFileAsync = promisify(execFile);

@Injectable()
export class OcrService {

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private invoiceService: InvoiceService,
    private quoteService: QuoteService,
    private projectService: ProjectService,
    private orderService: PurchaseOrderService,
  ) {}

  // =========================================
  // MAIN OCR
  // =========================================

  async processDocument(
    id: number,
    documentType: string,
    contactId: number,
  ) {

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

    // =========================================
    // SAVE PDF TEMPORARILY
    // =========================================

    const tempDir = path.join(
      process.cwd(),
      'uploads',
    );

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, {
        recursive: true,
      });
    }

    const filePath = path.join(
      tempDir,
      fileName,
    );

    fs.writeFileSync(
      filePath,
      pdfBuffer,
    );

    // =========================================
    // PDF → TEXT
    // =========================================

    const extractedText =
      await this.extractPdfText(filePath);

    // =========================================
    // AI ANALYSIS
    // =========================================

    const aiSummary =
      extractedText.substring(0, 300);

    const extractedJson =
      await this.aiService.extractDocument(
        extractedText,
        documentType,
      );

    const aiInsights =
      await this.aiService.generateInsights(
        extractedJson,
        documentType,
      );

    const confidenceScore =
      this.aiService.calculateConfidence(
        extractedJson,
      );

    const executiveReport =
      await this.aiService.generateExecutiveReport(
        extractedJson,
        aiInsights,
        documentType,
      );

    // =========================================
    // SAVE OCR DOCUMENT
    // =========================================

    const document =
      await this.prisma.ocrDocument.create({

        data: {

          fileName,

          originalName: fileName,

          mimeType: 'application/pdf',

          fileUrl: `/uploads/${fileName}`,

          documentType,

          extractedText,

          aiSummary,

          extractedJson,

          aiInsights,

          aiExecutiveReport:
            executiveReport,

          contactId,

          confidenceScore,

          status: 'COMPLETED',

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

    return document;
  }

  // =========================================
  // PDF → IMAGE → OCR
  // =========================================

  async extractPdfText(
    pdfPath: string,
  ): Promise<string> {

    const outputDir =
      path.join(
        process.cwd(),
        'uploads',
        'ocr-temp',
      );

    // =========================================
    // CREATE TEMP DIRECTORY
    // =========================================

    if (!fs.existsSync(outputDir)) {

      fs.mkdirSync(outputDir, {
        recursive: true,
      });

    }

    const prefix =
      `pdf-${Date.now()}`;

    try {

      // =========================================
      // PDF → PNG
      // =========================================

      if (process.env.NODE_ENV === 'production') {

        // =========================================
        // PRODUCTION / RENDER
        // Linux
        // Uses pdftoppm from poppler-utils
        // =========================================

        console.log(
          '🐧 Production environment detected: using pdftoppm',
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

        // =========================================
        // LOCAL DEVELOPMENT
        // Windows
        // Uses pdf-poppler
        // =========================================

        console.log(
          '🪟 Development environment detected: using pdf-poppler',
        );

        // IMPORTANT:
        // pdf-poppler is loaded ONLY locally.
        // It must not be required at the top of the file.

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

      // =========================================
      // GET GENERATED IMAGES
      // =========================================

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

      // =========================================
      // OCR EACH PAGE
      // =========================================

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
          `🔎 OCR processing: ${image}`,
        );

        const result =
          await Tesseract.recognize(
            imagePath,
            'eng',
          );

        fullText +=
          '\n' +
          result.data.text;
      }

      return fullText.trim();

    } finally {

      // =========================================
      // CLEAN TEMP PNG FILES
      // =========================================

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

  // =========================================
  // EXTRACT INVOICE DATA
  // =========================================

  extractInvoiceData(text: string) {

    const invoiceNumber =
      text.match(
        /INV-\d{4}-\d+/,
      )?.[0];

    const date =
      text.match(
        /\d{2}\/\d{2}\/\d{4}/,
      )?.[0];

    const email =
      text.match(
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/,
      )?.[0];

    const total =
      text.match(
        /Total\s+(\d+)/i,
      )?.[1];

    const subtotal =
      text.match(
        /Sub Total\s+(\d+)/i,
      )?.[1];

    const tax =
      text.match(
        /TVA.*?(\d+)/i,
      )?.[1];

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

  // =========================================
  // FIND DOCUMENTS BY USER
  // =========================================

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

  // =========================================
  // VERIFY DOCUMENT EXISTENCE
  // =========================================

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