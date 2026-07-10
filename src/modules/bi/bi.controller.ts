import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';

import { BiService } from './bi.service';

@Controller('bi')
export class BiController {

  constructor(
    private readonly biService: BiService,
  ) {}

@Get('dashboard/:userId')
getDashboard(
  @Param('userId')
  userId: string,
) {
  return this.biService.getDashboard(
    Number(userId),
  );
}

}