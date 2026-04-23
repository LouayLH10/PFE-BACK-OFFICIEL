import { Injectable } from '@nestjs/common';
import { CreatePhaseDto } from './dto/create-phase.dto';
import { UpdatePhaseDto } from './dto/update-phase.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PhaseService {
  constructor(private prisma: PrismaService) {}

  // ✅ CREATE
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
          connect: { id: projectId },
        },
      },
      include: {
        project: true,
        deliverables: true, // 🔥 relation
      },
    });
  }

  // ✅ FIND ALL
  async findAll() {
    return await this.prisma.phase.findMany({
      include: {
        project: true,
        deliverables: true,
      },
      orderBy: {
        id: 'desc', // ✅ safe (évite erreur createdAt)
      },
    });
  }

  // ✅ FIND ONE
  async findOne(id: number) {
    return await this.prisma.phase.findUnique({
      where: { id },
      include: {
        project: true,
        deliverables: true,
      },
    });
  }

  // ✅ UPDATE
  async update(id: number, dto: UpdatePhaseDto) {
    const { projectId, startDate, endDate, ...rest } = dto;

    return await this.prisma.phase.update({
      where: { id },
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
            connect: { id: projectId },
          },
        }),
      },
      include: {
        project: true,
        deliverables: true,
      },
    });
  }

  // ✅ DELETE
  async remove(id: number) {
    return await this.prisma.phase.delete({
      where: { id },
    });
  }

  // ✅ BONUS : phases par project
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