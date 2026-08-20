import { Injectable } from '@nestjs/common';

import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ContactService {

  // =========================================================
  // CONSTRUCTEUR — Injection des dépendances
  // =========================================================

  constructor(
    private prisma: PrismaService,
  ) {}

  // =========================================================
  // CRÉATION D'UN CONTACT
  // =========================================================

  async create(createContactDto: CreateContactDto) {

    return await this.prisma.contact.create({
      data: createContactDto,
    });

  }

  // =========================================================
  // RÉCUPÉRATION DE TOUS LES CONTACTS
  // =========================================================

  async findAll() {

    return await this.prisma.contact.findMany({
      include: {
        user: true,
      },
    });

  }

  // =========================================================
  // RÉCUPÉRATION D'UN CONTACT PAR SON ID
  // =========================================================

  async findOne(id: number) {

    return await this.prisma.contact.findUnique({
      where: {
        id,
      },
      include: {
        user: true,
      },
    });

  }

  // =========================================================
  // MODIFICATION D'UN CONTACT
  // =========================================================

  async update(
    id: number,
    updateContactDto: UpdateContactDto,
  ) {

    return await this.prisma.contact.update({
      where: {
        id,
      },
      data: updateContactDto,
    });

  }

  // =========================================================
  // SUPPRESSION D'UN CONTACT
  // =========================================================

  async remove(id: number) {

    return await this.prisma.contact.delete({
      where: {
        id,
      },
    });

  }

}