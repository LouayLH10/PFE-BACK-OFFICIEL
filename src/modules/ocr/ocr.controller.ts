// ocr.controller.ts

import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { diskStorage } from 'multer';

import { extname } from 'path';

import { OcrService } from './ocr.service';

@Controller('ocr')
export class OcrController {

  constructor(
    private readonly ocrService: OcrService,
  ) {}

  // =========================================
  // 🔥 OCR UPLOAD ENDPOINT
  // =========================================

  @Post('upload')

  @UseInterceptors(
    FileInterceptor('file', {

      storage: diskStorage({

        destination:
          './uploads',

        filename: (
          req,
          file,
          callback,
        ) => {

          const uniqueName =
            `${Date.now()}${extname(
              file.originalname,
            )}`;

          callback(
            null,
            uniqueName,
          );

        },

      }),

    }),
  )

  async uploadDocument(

    @UploadedFile()
    file: Express.Multer.File,

    @Body('documentType')
    documentType: string,

  ) {

    return await this.ocrService.processDocument(
      file,
      documentType,
    );

  }

}