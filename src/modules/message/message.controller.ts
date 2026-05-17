import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  // ✅ CREATE MESSAGE (avec fichier)
   @Post()
  @UseInterceptors(
    FileInterceptor('file', {

      storage: diskStorage({

        destination: './uploads',

        filename: (
          req,
          file,
          callback,
        ) => {

          const uniqueName =
            Date.now() +
            '-' +
            Math.round(Math.random() * 1e9) +
            extname(file.originalname);

          callback(null, uniqueName);
        },

      }),

    }),
  )
  create(
    @Body() createMessageDto: CreateMessageDto,

    @UploadedFile()
    file?: Express.Multer.File,
  ) {

    return this.messageService.create(
      createMessageDto,
      file,
    );

  }
  // ✅ GET ALL
  @Get()
  findAll() {
    return this.messageService.findAll();
  }

  // ✅ GET CONVERSATION (IMPORTANT 🔥)
  @Get('conversation')
  getConversation(
    @Query('user1Id', ParseIntPipe) user1Id: number,
    @Query('user2Id', ParseIntPipe) user2Id: number,
  ) {
    return this.messageService.getConversation(user1Id, user2Id);
  }

  // ✅ GET ONE
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.messageService.findOne(id);
  }

  // ✅ UPDATE
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMessageDto: UpdateMessageDto,
  ) {
    return this.messageService.update(id, updateMessageDto);
  }

  // ✅ DELETE
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.messageService.remove(id);
  }
}
