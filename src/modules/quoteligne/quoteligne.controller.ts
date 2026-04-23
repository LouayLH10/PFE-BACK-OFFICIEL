import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { QuoteligneService } from './quoteligne.service';
import { CreateQuoteligneDto } from './dto/create-quoteligne.dto';
import { UpdateQuoteligneDto } from './dto/update-quoteligne.dto';

@Controller('quoteligne')
export class QuoteligneController {
  constructor(private readonly quoteligneService: QuoteligneService) {}

  @Post()
  create(@Body() createQuoteligneDto: CreateQuoteligneDto) {
    return this.quoteligneService.create(createQuoteligneDto);
  }

  @Get()
  findAll() {
    return this.quoteligneService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quoteligneService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateQuoteligneDto: UpdateQuoteligneDto) {
    return this.quoteligneService.update(+id, updateQuoteligneDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.quoteligneService.remove(+id);
  }
  
}
