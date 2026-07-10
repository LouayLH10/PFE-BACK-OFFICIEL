// ocr.service.ts

import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import * as Tesseract from 'tesseract.js';

import * as fs from 'fs';

import * as path from 'path';
import { AiService } from '../IA/ai/ai.service';
import { InvoiceService } from '../invoice/invoice.service';
import { QuoteService } from '../quote/quote.service';
import { ProjectService } from '../project/project.service';
import { PurchaseOrderService } from '../purchase-order/purchase-order.service';

const pdfPoppler = require('pdf-poppler');

@Injectable()
export class OcrService {

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private invoiceService:InvoiceService,
    private quoteService:QuoteService,
    private projectService:ProjectService,
    private orderService:PurchaseOrderService
  ) {}

  // =========================================
  // 🔥 MAIN OCR
  // =========================================

async processDocument(
  id: number,
  documentType: string,
  contactId:number
) {

  let pdfBuffer: Buffer;
  let fileName = '';

  switch (documentType) {

    case 'invoice':

      pdfBuffer =
        await this.invoiceService
          .generatePdfById(id);

      fileName =
        `invoice-${id}.pdf`;

      break;

    case 'quote':

      pdfBuffer =
        await this.quoteService
          .generatePdfById(id);

      fileName =
        `quote-${id}.pdf`;

      break;

    case 'project':

      pdfBuffer =
        await this.projectService
          .generatePdfById(id);

      fileName =
        `project-${id}.pdf`;

      break;

    case 'purchase_order':

      pdfBuffer =
        await this.orderService
          .generatePdfById(id);

      fileName =
        `purchase-order-${id}.pdf`;

      break;

    default:

      throw new BadRequestException(
        'Unsupported document type',
      );

  }

  const tempDir = path.join(
    process.cwd(),
    'uploads',
  );

  const filePath = path.join(
    tempDir,
    fileName,
  );

  fs.writeFileSync(
    filePath,
    pdfBuffer,
  );

  const extractedText =
    await this.extractPdfText(
      filePath,
    );

  const aiSummary =
    extractedText.substring(
      0,
      300,
    );

  const extractedJson =
    await this.aiService
      .extractDocument(
        extractedText,
        documentType,
      );

  const aiInsights =
    await this.aiService
      .generateInsights(
        extractedJson,
        documentType,
      );

  const confidenceScore =
    this.aiService
      .calculateConfidence(
        extractedJson,
      );
const executiveReport =
  await this.aiService.generateExecutiveReport(
    extractedJson,
    aiInsights,
    documentType,
  );
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
   aiExecutiveReport:executiveReport,
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
  // 🔥 PDF → IMAGE → OCR
  // =========================================

  async extractPdfText(
    pdfPath: string,
  ) {

    const outputDir =
      path.join(
        process.cwd(),
        'uploads',
        'ocr-temp',
      );

    // 🔥 create folder
    if (
      !fs.existsSync(outputDir)
    ) {

      fs.mkdirSync(outputDir, {
        recursive: true,
      });

    }

    // =========================================
    // 🔥 CONVERT PDF TO PNG
    // =========================================

    const opts = {

      format: 'png',

      out_dir: outputDir,

      out_prefix:
        `pdf-${Date.now()}`,

      page: null,

    };

    await pdfPoppler.convert(
      pdfPath,
      opts,
    );

    // =========================================
    // 🔥 GET GENERATED IMAGES
    // =========================================

    const files =
      fs.readdirSync(outputDir);

    const imageFiles =
      files.filter((f) =>
        f.endsWith('.png'),
      );

    let fullText = '';

    // =========================================
    // 🔥 OCR EACH PAGE
    // =========================================

    for (
      const image of imageFiles
    ) {

      const imagePath =
        path.join(
          outputDir,
          image,
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

    // =========================================
    // 🔥 CLEAN TEMP FILES
    // =========================================

    for (
      const image of imageFiles
    ) {

      fs.unlinkSync(
        path.join(
          outputDir,
          image,
        ),
      );

    }

    return fullText;

  }
extractInvoiceData(text: string) {

  const invoiceNumber =
    text.match(/INV-\d{4}-\d+/)?.[0];

  const date =
    text.match(
      /\d{2}\/\d{2}\/\d{4}/,
    )?.[0];

  const email =
    text.match(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/
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
async findByUser(userId: number) {

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