import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DeliveryNoteligneService } from './delivery-noteligne.service';
import { CreateDeliveryNoteligneDto } from './dto/create-delivery-noteligne.dto';
import { UpdateDeliveryNoteligneDto } from './dto/update-delivery-noteligne.dto';

@Controller('delivery-noteligne')
export class DeliveryNoteligneController {
  constructor(private readonly deliveryNoteligneService: DeliveryNoteligneService) {}

  @Post()
  create(@Body() createDeliveryNoteligneDto: CreateDeliveryNoteligneDto) {
    return this.deliveryNoteligneService.create(createDeliveryNoteligneDto);
  }

  @Get()
  findAll() {
    return this.deliveryNoteligneService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deliveryNoteligneService.findOne(+id);
  }



  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deliveryNoteligneService.remove(+id);
  }
}
