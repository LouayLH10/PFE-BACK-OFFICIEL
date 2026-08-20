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

}
