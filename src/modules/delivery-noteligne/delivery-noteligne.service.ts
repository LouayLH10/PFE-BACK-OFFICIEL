import { Injectable } from '@nestjs/common';
import { CreateDeliveryNoteligneDto } from './dto/create-delivery-noteligne.dto';
import { UpdateDeliveryNoteligneDto } from './dto/update-delivery-noteligne.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DeliveryNoteligneService {
    constructor(private prisma: PrismaService) {}

  async create(dto: CreateDeliveryNoteligneDto) {
    return this.prisma.deliveryNoteLine.create({
      data: dto,
    });
  }

  findAll() {
    return this.prisma.deliveryNoteLine.findMany();
  }

  findOne(id: number) {
    return this.prisma.deliveryNoteLine.findUnique({
      where: { id },
    });
  }

  remove(id: number) {
    return this.prisma.deliveryNoteLine.delete({
      where: { id },
    });
  }
}
