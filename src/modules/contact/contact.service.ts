import { Injectable } from '@nestjs/common';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ContactService {

  constructor(private prisma: PrismaService) {}

  async create(createContactDto: CreateContactDto) {
    return await this.prisma.contact.create({
      data: createContactDto,
      
    });
  }

  async findAll() {
    return await this.prisma.contact.findMany({
      include: { user: true }
    });
  }

  async findOne(id: number) {
    return await this.prisma.contact.findUnique({
      where: { id },
      include: { user: true }
    });
  }

  async update(id: number, updateContactDto: UpdateContactDto) {
    return await this.prisma.contact.update({
      where: { id },
      data: updateContactDto,
    });
  }

  async remove(id: number) {
    return await this.prisma.contact.delete({
      where: { id },
    });
  }

}