import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DelivrableService } from './delivrable.service';
import { CreateDelivrableDto } from './dto/create-delivrable.dto';
import { UpdateDelivrableDto } from './dto/update-delivrable.dto';

@Controller('delivrable')
export class DelivrableController {
  constructor(private readonly delivrableService: DelivrableService) {}

  @Post()
  create(@Body() createDelivrableDto: CreateDelivrableDto) {
    return this.delivrableService.create(createDelivrableDto);
  }

  @Get()
  findAll() {
    return this.delivrableService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.delivrableService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDelivrableDto: UpdateDelivrableDto) {
    return this.delivrableService.update(+id, updateDelivrableDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.delivrableService.remove(+id);
  }
}
