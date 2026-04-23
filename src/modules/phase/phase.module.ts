import { Module } from '@nestjs/common';
import { PhaseService } from './phase.service';
import { PhaseController } from './phase.controller';

@Module({
  controllers: [PhaseController],
  providers: [PhaseService],
})
export class PhaseModule {}
