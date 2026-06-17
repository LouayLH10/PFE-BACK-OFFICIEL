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

const pdfPoppler = require('pdf-poppler');

@Injectable()
export class OcrService {

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  // =========================================
  // 🔥 MAIN OCR
  // =========================================

  async processDocument(
    file: Express.Multer.File,
    documentType: string,
  ) {

    if (!file) {

      throw new BadRequestException(
        'File is required',
      );

    }

    const filePath = file.path;

    const mimeType = file.mimetype;

    let extractedText = '';

    // =========================================
    // 🔥 PDF OCR
    // =========================================

    if (
      mimeType === 'application/pdf'
    ) {

      extractedText =
        await this.extractPdfText(
          filePath,
        );

    }

    // =========================================
    // 🔥 IMAGE OCR
    // =========================================

    else if (
      mimeType.includes('image')
    ) {

      const result =
        await Tesseract.recognize(
          filePath,
          'eng',
        );

      extractedText =
        result.data.text;

    }

    // =========================================
    // 🔥 UNSUPPORTED
    // =========================================

    else {

      throw new BadRequestException(
        'Unsupported file type',
      );

    }

    // =========================================
    // 🔥 FALLBACK
    // =========================================

    if (!extractedText) {

      extractedText =
        'No text extracted';

    }

    // =========================================
    // 🔥 AI SUMMARY
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
    // =========================================
    // 🔥 SAVE DB
    // =========================================

    const document =
      await this.prisma.ocrDocument.create({

        data: {

          fileName:
            file.filename,

          originalName:
            file.originalname,

          mimeType,

          fileUrl:
            `/uploads/${file.filename}`,

          documentType,

          extractedText,

          aiSummary,
           aiInsights,
        extractedJson,
          status:
            'COMPLETED',

        },

      });

    return {

      message:
        'OCR processed successfully',

      document,

    };

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
}