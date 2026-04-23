import { Injectable } from '@nestjs/common';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MilestoneService {
  constructor(private prisma: PrismaService) {}

  // ✅ CREATE
  async create(dto: CreateMilestoneDto) {
    const { projectId, deadline, ...rest } = dto;

    return await this.prisma.milestone.create({
      data: {
        ...rest,

        deadline: deadline
          ? new Date(deadline)
          : new Date(),

        project: {
          connect: { id: projectId },
        },
      },
      include: {
        project: true,
      },
    });
  }

  // ✅ FIND ALL
  async findAll() {
    return await this.prisma.milestone.findMany({
      include: {
        project: true,
      },
      orderBy: {
        id: 'desc',
      },
    });
  }

  // ✅ FIND ONE
  async findOne(id: number) {
    return await this.prisma.milestone.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });
  }

  // ✅ UPDATE
  async update(id: number, dto: UpdateMilestoneDto) {
    const { projectId, deadline, ...rest } = dto;

    return await this.prisma.milestone.update({
      where: { id },
      data: {
        ...rest,

        ...(deadline && {
          deadline: new Date(deadline),
        }),

        ...(projectId && {
          project: {
            connect: { id: projectId },
          },
        }),
      },
      include: {
        project: true,
      },
    });
  }

  // ✅ DELETE
  async remove(id: number) {
    return await this.prisma.milestone.delete({
      where: { id },
    });
  }

  // ✅ BONUS : milestones par project
  async findByProject(projectId: number) {
    return await this.prisma.milestone.findMany({
      where: {
        projectId,
      },
      orderBy: {
        deadline: 'asc',
      },
    });
  }

}