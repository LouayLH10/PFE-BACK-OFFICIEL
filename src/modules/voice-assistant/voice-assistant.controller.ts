import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { VoiceAssistantService } from './voice-assistant.service';
import { SimulateVoiceDto } from './dto/simulate-voice.dto';
import { JwtAuthGuard } from '../contact/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService } from '../IA/ai/ai.service';

@Controller('voice-assistant')
export class VoiceAssistantController {
  constructor(
    private readonly voiceAssistantService: VoiceAssistantService,
   private readonly aiService:AiService
  ) {}
 @UseGuards(JwtAuthGuard)
@Post("audio")
@UseInterceptors(FileInterceptor("audio"))
async audio(
  @UploadedFile() file: Express.Multer.File,
  @Req() req,
  @Res() res,
) {

  console.log('FILE:', file);
  console.log('USER:', req.user);
  const text = await this.aiService.speechToText(file);

  const pdf = await this.voiceAssistantService.simulate(
    { text },
    req.user.userId,
  );

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": 'attachment; filename="invoice.pdf"',
  });

  res.send(pdf);
}
}