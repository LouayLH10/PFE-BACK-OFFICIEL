import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { InvoiceligneService } from './invoiceligne.service';
import { CreateInvoiceLigneDto } from './dto/create-invoiceligne.dto';
import { UpdateInvoiceligneDto } from './dto/update-invoiceligne.dto';

@Controller('invoiceligne')
export class InvoiceligneController {
  constructor(private readonly invoiceligneService: InvoiceligneService) {}

  @Post()
  create(@Body() CreateInvoiceLigneDto: CreateInvoiceLigneDto) {
    return this.invoiceligneService.create(CreateInvoiceLigneDto);
  }

  @Get()
  findAll() {
    return this.invoiceligneService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoiceligneService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInvoiceligneDto: UpdateInvoiceligneDto) {
    return this.invoiceligneService.update(+id, updateInvoiceligneDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.invoiceligneService.remove(+id);
  }
}
