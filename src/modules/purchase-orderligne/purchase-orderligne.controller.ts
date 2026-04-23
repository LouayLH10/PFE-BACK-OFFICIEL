import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PurchaseOrderligneService } from './purchase-orderligne.service';
import { CreatePurchaseOrderligneDto } from './dto/create-purchase-orderligne.dto';
import { UpdatePurchaseOrderligneDto } from './dto/update-purchase-orderligne.dto';

@Controller('purchase-orderligne')
export class PurchaseOrderligneController {
  constructor(private readonly purchaseOrderligneService: PurchaseOrderligneService) {}

  @Post()
  create(@Body() createPurchaseOrderligneDto: CreatePurchaseOrderligneDto) {
    return this.purchaseOrderligneService.create(createPurchaseOrderligneDto);
  }

  @Get()
  findAll() {
    return this.purchaseOrderligneService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.purchaseOrderligneService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePurchaseOrderligneDto: UpdatePurchaseOrderligneDto) {
    return this.purchaseOrderligneService.update(+id, updatePurchaseOrderligneDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.purchaseOrderligneService.remove(+id);
  }
}
