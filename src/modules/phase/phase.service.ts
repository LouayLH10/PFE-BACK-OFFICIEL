import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { CreatePhaseDto } from './dto/create-phase.dto';
import { UpdatePhaseDto } from './dto/update-phase.dto';

@Injectable()
export class PhaseService {
  constructor(private prisma: PrismaService) {}

  // =========================================
  // CREATE
  // =========================================

  async create(dto: CreatePhaseDto) {
    const { projectId, startDate, endDate, ...rest } = dto;

    return await this.prisma.phase.create({
      data: {
        ...rest,

        startDate: startDate
          ? new Date(startDate)
          : new Date(),

        ...(endDate && {
          endDate: new Date(endDate),
        }),

        project: {
          connect: {
            id: projectId,
          },
        },
      },

      include: {
        project: true,
        deliverables: true,
      },
    });
  }

  // =========================================
  // FIND ALL
  // =========================================

  async findAll() {
    return await this.prisma.phase.findMany({
      include: {
        project: true,
        deliverables: true,
      },

      orderBy: {
        id: 'desc',
      },
    });
  }

  // =========================================
  // FIND ONE
  // =========================================

  async findOne(id: number) {
    return await this.prisma.phase.findUnique({
      where: {
        id,
      },

      include: {
        project: true,
        deliverables: true,
      },
    });
  }

  // =========================================
  // UPDATE
  // =========================================

  async update(id: number, dto: UpdatePhaseDto) {
    const { projectId, startDate, endDate, ...rest } = dto;

    return await this.prisma.phase.update({
      where: {
        id,
      },

      data: {
        ...rest,

        ...(startDate && {
          startDate: new Date(startDate),
        }),

        ...(endDate && {
          endDate: new Date(endDate),
        }),

        ...(projectId && {
          project: {
            connect: {
              id: projectId,
            },
          },
        }),
      },

      include: {
        project: true,
        deliverables: true,
      },
    });
  }

  // =========================================
  // DELETE
  // =========================================

  async remove(id: number) {
    return await this.prisma.phase.delete({
      where: {
        id,
      },
    });
  }

  // =========================================
  // FIND BY PROJECT
  // =========================================

  async findByProject(projectId: number) {
    return await this.prisma.phase.findMany({
      where: {
        projectId,
      },

      include: {
        deliverables: true,
      },

      orderBy: {
        id: 'asc',
      },
    });
  }
}