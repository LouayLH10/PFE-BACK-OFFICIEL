import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import Fuse from 'fuse.js';

import { PrismaService } from '../../prisma/prisma.service';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  // =========================================
  // CREATE
  // =========================================

  async create(dto: CreateProductDto) {
    return await this.prisma.product.create({
      data: {
        reference: dto.reference,
        name: dto.name,
        description: dto.description,
        unitPrice: dto.unitPrice,
        stock: dto.stock,
        unit: dto.unit,
        taxRate: dto.taxRate,
        active: dto.active ?? true,
      },
    });
  }

  // =========================================
  // FIND ALL
  // =========================================

  async findAll() {
    return await this.prisma.product.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  // =========================================
  // FIND ONE
  // =========================================

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  // =========================================
  // UPDATE
  // =========================================

  async update(id: number, updateDto: UpdateProductDto) {
    await this.findOne(id);

    return await this.prisma.product.update({
      where: {
        id,
      },
      data: {
        ...updateDto,
      },
    });
  }

  // =========================================
  // DELETE
  // =========================================

  async remove(id: number) {
    await this.findOne(id);

    return await this.prisma.product.delete({
      where: {
        id,
      },
    });
  }

  // =========================================
  // SEARCH PRODUCT BY TRANSLATION
  // =========================================

  async searchProduct(
    keyword: string,
    language: string = 'fr',
  ) {
    return await this.prisma.product.findFirst({
      where: {
        active: true,

        translations: {
          some: {
            language,

            name: {
              contains: keyword,
              mode: 'insensitive',
            },
          },
        },
      },

      include: {
        translations: {
          where: {
            language,
          },
        },
      },
    });
  }

  // =========================================
  // FIND BY REFERENCE
  // =========================================

  async findByReference(reference: string) {
    return await this.prisma.product.findUnique({
      where: {
        reference,
      },
    });
  }

  // =========================================
  // UPDATE STOCK
  // =========================================

  async updateStock(
    id: number,
    quantity: number,
  ) {
    const product = await this.findOne(id);

    if (product.stock + quantity < 0) {
      throw new BadRequestException(
        'Insufficient stock',
      );
    }

    return await this.prisma.product.update({
      where: {
        id,
      },

      data: {
        stock: {
          increment: quantity,
        },
      },
    });
  }

  // =========================================
  // FIND BY NAME
  // =========================================

  async findByName(name: string) {
    return await this.prisma.product.findFirst({
      where: {
        name: {
          contains: name,
          mode: 'insensitive',
        },
      },
    });
  }

  // =========================================
  // FUZZY PRODUCT SEARCH
  // =========================================

  async searchProducts(
    products: {
      name: string;
      quantity: number;
    }[],
  ) {
    const dbProducts =
      await this.prisma.product.findMany({
        include: {
          translations: true,
        },
      });

    const fuseData = dbProducts.map((product) => ({
      product,

      names: [
        product.name,
        ...product.translations.map(
          (translation) => translation.name,
        ),
      ],
    }));

    const fuse = new Fuse(fuseData, {
      keys: ['names'],
      threshold: 0.4,
      ignoreLocation: true,
      includeScore: true,
    });

    const found: {
      productId: number;
      quantity: number;
      name: string;
    }[] = [];

    const notFound: string[] = [];

    // =========================================
    // MATCH PRODUCTS
    // =========================================

    for (const item of products) {
      const matches = fuse.search(item.name);

      if (!matches.length) {
        console.log(
          `Produit introuvable : ${item.name}`,
        );

        notFound.push(item.name);

        continue;
      }

      const bestMatch = matches[0];

      console.log(
        `${item.name} -> ${bestMatch.item.product.name} ` +
        `(score: ${bestMatch.score})`,
      );

      found.push({
        productId: bestMatch.item.product.id,
        quantity: item.quantity,
        name: bestMatch.item.product.name,
      });
    }

    return {
      found,
      notFound,
    };
  }
}