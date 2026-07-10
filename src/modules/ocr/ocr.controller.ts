import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { OcrService } from './ocr.service';

@Controller('ocr')
export class OcrController {

  constructor(
    private readonly ocrService: OcrService,
  ) {}

  @Post('analyze')
  async analyzeDocument(

    @Body('id')
    id: number,

    @Body('documentType')
    documentType: string,
 @Body('contactId')
    contactId: number,
  ) {

    return await this.ocrService.processDocument(
      Number(id),
      documentType,
      contactId
    );

  }

@Get('analyse/:userId')
async findByUser(
  @Param('userId') userId: string,
) {

  return this.ocrService.findByUser(
    Number(userId),
  );

}
@Post('verify')
async verifyDocument(
  @Body('id') id: number,
  @Body('documentType')
  documentType: string,
) {
  return this.ocrService.verifyExistence(
    Number(id),
    documentType,
  );
}

}