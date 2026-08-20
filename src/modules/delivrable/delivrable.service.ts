import { Injectable } from '@nestjs/common';

import { CreateDelivrableDto } from './dto/create-delivrable.dto';
import { UpdateDelivrableDto } from './dto/update-delivrable.dto';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DelivrableService {
  constructor(private prisma: PrismaService) {}

  // ============================================================
  // CREATE DELIVERABLE
  // ============================================================

  async create(dto: CreateDelivrableDto) {
    const { phaseId, ...data } = dto;

    return this.prisma.deliverable.create({
      data: {
        ...data,

        // Conversion de la date reçue en objet Date
        deadline: new Date(dto.deadline),

        // Association du livrable à sa phase
        phase: {
          connect: {
            id: phaseId,
          },
        },
      },
    });
  }

 
}