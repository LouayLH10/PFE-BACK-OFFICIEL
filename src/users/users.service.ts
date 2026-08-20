import { Injectable } from '@nestjs/common';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // =========================================
  // CREATE
  // =========================================

  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  // =========================================
  // FIND ALL
  // =========================================

  async findAll() {
    return await this.prisma.user.findMany();
  }

  // =========================================
  // FIND ONE
  // =========================================

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  // =========================================
  // UPDATE
  // =========================================

  update(
    id: number,
    updateUserDto: UpdateUserDto,
  ) {
    return `This action updates a #${id} user`;
  }

  // =========================================
  // DELETE
  // =========================================

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  // =========================================
  // UPDATE LANGUAGE
  // =========================================

  async updateLanguage(
    userId: number,
    language: string,
  ) {
    return await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        language,
      },
      select: {
        id: true,
        email: true,
        language: true,
      },
    });
  }
}