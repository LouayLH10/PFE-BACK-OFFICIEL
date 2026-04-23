import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePurchaseOrderligneDto } from './dto/create-purchase-orderligne.dto';
import { UpdatePurchaseOrderligneDto } from './dto/update-purchase-orderligne.dto';

@Injectable()
export class PurchaseOrderligneService {

  constructor(private prisma: PrismaService) {}

  // ✅ CREATE
  async create(dto: CreatePurchaseOrderligneDto) {

    const totalPriceWithoutTVA = dto.quantity * dto.unitPrice;
    const totalPrice = totalPriceWithoutTVA + (totalPriceWithoutTVA * dto.tva / 100);

    return await this.prisma.$transaction(async (prisma) => {

      const line = await prisma.purchaseOrderLine.create({
        data: {
          ...dto,
          totalPriceWithoutTVA,
          totalPrice,
        },
      });

      const po = await prisma.purchaseOrder.findUnique({
        where: { id: dto.purchaseOrderId },
      });

      const newSubTotal = (po?.subTotal || 0) + totalPriceWithoutTVA;
      const newTax = (po?.tax || 0) + (totalPrice - totalPriceWithoutTVA);
      const newTotal = newSubTotal + newTax;

      await prisma.purchaseOrder.update({
        where: { id: dto.purchaseOrderId },
        data: {
          subTotal: newSubTotal,
          tax: newTax,
          total: newTotal,
        },
      });

      return line;
    });
  }

  // ✅ FIND ALL
  async findAll() {
    return this.prisma.purchaseOrderLine.findMany({
      include: { purchaseOrder: true },
    });
  }

  // ✅ FIND ONE
  async findOne(id: number) {
    return this.prisma.purchaseOrderLine.findUnique({
      where: { id },
      include: { purchaseOrder: true },
    });
  }

  // ✅ UPDATE
  async update(id: number, dto: UpdatePurchaseOrderligneDto) {

    return await this.prisma.$transaction(async (prisma) => {

      const old = await prisma.purchaseOrderLine.findUnique({
        where: { id },
      });

      if (!old) throw new Error('Line not found');

      const quantity = dto.quantity ?? old.quantity;
      const unitPrice = dto.unitPrice ?? old.unitPrice;
      const tva = dto.tva ?? old.tva;

      const newWithoutTVA = quantity * unitPrice;
      const newTotal = newWithoutTVA + (newWithoutTVA * tva / 100);

      const updated = await prisma.purchaseOrderLine.update({
        where: { id },
        data: {
          ...dto,
          totalPriceWithoutTVA: newWithoutTVA,
          totalPrice: newTotal,
        },
      });

      const po = await prisma.purchaseOrder.findUnique({
        where: { id: old.purchaseOrderId },
      });

      const oldTax = old.totalPrice - old.totalPriceWithoutTVA;
      const newTax = newTotal - newWithoutTVA;

      const newSubTotal =
        (po?.subTotal || 0) - old.totalPriceWithoutTVA + newWithoutTVA;

      const updatedTax =
        (po?.tax || 0) - oldTax + newTax;

      const newTotalPO = newSubTotal + updatedTax;

      await prisma.purchaseOrder.update({
        where: { id: old.purchaseOrderId },
        data: {
          subTotal: newSubTotal,
          tax: updatedTax,
          total: newTotalPO,
        },
      });

      return updated;
    });
  }

  // ✅ DELETE
  async remove(id: number) {

    return await this.prisma.$transaction(async (prisma) => {

      const line = await prisma.purchaseOrderLine.findUnique({
        where: { id },
      });

      if (!line) throw new Error('Line not found');

      const taxPart = line.totalPrice - line.totalPriceWithoutTVA;

      await prisma.purchaseOrderLine.delete({
        where: { id },
      });

      const po = await prisma.purchaseOrder.findUnique({
        where: { id: line.purchaseOrderId },
      });

      const newSubTotal = (po?.subTotal || 0) - line.totalPriceWithoutTVA;
      const newTax = (po?.tax || 0) - taxPart;
      const newTotal = newSubTotal + newTax;

      await prisma.purchaseOrder.update({
        where: { id: line.purchaseOrderId },
        data: {
          subTotal: newSubTotal,
          tax: newTax,
          total: newTotal,
        },
      });

      return { message: 'Deleted successfully' };
    });
  }
}