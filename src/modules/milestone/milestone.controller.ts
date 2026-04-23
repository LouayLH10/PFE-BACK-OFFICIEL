import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MilestoneService } from './milestone.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';

@Controller('milestone')
export class MilestoneController {
  constructor(private readonly milestoneService: MilestoneService) {}

  @Post()
  create(@Body() createMilestoneDto: CreateMilestoneDto) {
    return this.milestoneService.create(createMilestoneDto);
  }

  @Get()
  findAll() {
    return this.milestoneService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.milestoneService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMilestoneDto: UpdateMilestoneDto) {
    return this.milestoneService.update(+id, updateMilestoneDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.milestoneService.remove(+id);
  }
}
