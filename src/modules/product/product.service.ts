import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import Fuse from "fuse.js";

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    const { categoryId, ...data } = createProductDto;

    return this.prisma.product.create({
      data: {
        ...data,
        category: {
          connect: {
            id: categoryId,
          },
        },
      },
      include: {
        category: true,
      },
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: number, updateDto: UpdateProductDto) {
    await this.findOne(id);

    const { categoryId, ...data } = updateDto;

    return this.prisma.product.update({
      where: {
        id,
      },
      data: {
        ...data,
        ...(categoryId && {
          category: {
            connect: {
              id: categoryId,
            },
          },
        }),
      },
      include: {
        category: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.product.delete({
      where: {
        id,
      },
    });
  }

 async searchProduct(keyword: string, language: string = 'fr') {
  return this.prisma.product.findFirst({
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
      category: true,
      translations: {
        where: {
          language,
        },
      },
    },
  });
}

  async findByReference(reference: string) {
    return this.prisma.product.findUnique({
      where: {
        reference,
      },
      include: {
        category: true,
      },
    });
  }

  async updateStock(id: number, quantity: number) {
    const product = await this.findOne(id);

    if (product.stock + quantity < 0) {
      throw new BadRequestException('Insufficient stock');
    }

    return this.prisma.product.update({
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
  async findByName(name: string) {
  return this.prisma.product.findFirst({
    where: {
      name: {
        contains: name,
        mode: 'insensitive',
      },
    },
    include: {
      category: true,
    },
  });
}
async searchProducts(
  products: {
    name: string;
    quantity: number;
  }[],
) {

  const dbProducts = await this.prisma.product.findMany({
    include: {
      translations: true,
    },
  });

  const fuseData = dbProducts.map((product) => ({
    product,
    names: [
      product.name,
      ...product.translations.map((t) => t.name),
    ],
  }));

  const fuse = new Fuse(fuseData, {
    keys: ["names"],
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

  for (const item of products) {

    const matches = fuse.search(item.name);

    if (!matches.length) {

      console.log(`Produit introuvable : ${item.name}`);

      notFound.push(item.name);

      continue;
    }

    const bestMatch = matches[0];

    console.log(
      `${item.name} -> ${bestMatch.item.product.name} (score: ${bestMatch.score})`,
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