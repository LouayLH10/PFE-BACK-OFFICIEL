import { Injectable } from '@nestjs/common';

import { CreateDeliveryNoteligneDto } from './dto/create-delivery-noteligne.dto';
import { UpdateDeliveryNoteligneDto } from './dto/update-delivery-noteligne.dto';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DeliveryNoteligneService {
  constructor(private prisma: PrismaService) {}

  // ============================================================
  // 1. CRÉATION D'UNE LIGNE DE BON DE LIVRAISON
  // ============================================================

  async create(dto: CreateDeliveryNoteligneDto) {
    return this.prisma.deliveryNoteLine.create({
      data: dto,
    });
  }

  // ============================================================
  // 2. RÉCUPÉRATION DE TOUTES LES LIGNES
  // ============================================================

  findAll() {
    return this.prisma.deliveryNoteLine.findMany();
  }

  // ============================================================
  // 3. RÉCUPÉRATION D'UNE LIGNE PAR SON ID
  // ============================================================

  findOne(id: number) {
    return this.prisma.deliveryNoteLine.findUnique({
      where: { id },
    });
  }

  // ============================================================
  // 4. SUPPRESSION D'UNE LIGNE
  // ============================================================

  remove(id: number) {
    return this.prisma.deliveryNoteLine.delete({
      where: { id },
    });
  }
}