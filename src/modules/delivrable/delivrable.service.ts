import { Injectable } from '@nestjs/common';
import { CreateDelivrableDto} from './dto/create-delivrable.dto';
import { UpdateDelivrableDto } from './dto/update-delivrable.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DelivrableService {
  constructor(private prisma: PrismaService) {}
async create(dto: CreateDelivrableDto) {
  const { phaseId, ...data } = dto;

  return this.prisma.deliverable.create({
    data: {
      ...data,
      deadline: new Date(dto.deadline),
      phase: {
        connect: { id: phaseId },
      },
    },
  });
}

  findAll() {
    return `This action returns all delivrable`;
  }

  findOne(id: number) {
    return `This action returns a #${id} delivrable`;
  }

  update(id: number, updateDelivrableDto: UpdateDelivrableDto) {
    return `This action updates a #${id} delivrable`;
  }

  remove(id: number) {
    return `This action removes a #${id} delivrable`;
  }
}
