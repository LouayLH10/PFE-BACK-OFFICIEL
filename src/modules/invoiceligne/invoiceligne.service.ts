import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateInvoiceLigneDto } from './dto/create-invoiceligne.dto';
import { UpdateInvoiceligneDto } from './dto/update-invoiceligne.dto';

@Injectable()
export class InvoiceligneService {

  constructor(private prisma: PrismaService) {}

  // ✅ CREATE + update invoice
  async create(dto: CreateInvoiceLigneDto) {
    const totalPrice = dto.quantity * dto.unitPrice;

    return await this.prisma.$transaction(async (prisma) => {

      // 1️⃣ créer ligne
      const ligne = await prisma.invoiceLigne.create({
        data: {
          ...dto,
          totalPrice,
        },
      });

      // 2️⃣ récupérer invoice
      const invoice = await prisma.invoice.findUnique({
        where: { id: dto.invoiceId },
      });
const tva = invoice?.tva ?? 19;

const newSubTotal = (invoice?.subTotal || 0) + totalPrice;

const taxTotal = newSubTotal * (tva / 100);

const total = newSubTotal + taxTotal;
      // 3️⃣ update invoice
      await prisma.invoice.update({
        where: { id: dto.invoiceId },
        data: {
          subTotal: newSubTotal,
          taxTotal,
          total,
          balanceDue: total - (invoice?.amountPaid || 0),
        },
      });

      return ligne;
    });
  }

  // ✅ FIND ALL
  async findAll() {
    return await this.prisma.invoiceLigne.findMany({
      include: {
        invoice: true,
      },
    });
  }

  // ✅ FIND ONE
  async findOne(id: number) {
    return await this.prisma.invoiceLigne.findUnique({
      where: { id },
      include: {
        invoice: true,
      },
    });
  }

  // ✅ UPDATE (avec recalcul)
  async update(id: number, dto: UpdateInvoiceligneDto) {

    return await this.prisma.$transaction(async (prisma) => {

      const old = await prisma.invoiceLigne.findUnique({
        where: { id },
      });

      if (!old) throw new Error('Line not found');

      const newTotalPrice = (dto.quantity ?? old.quantity) * (dto.unitPrice ?? old.unitPrice);

      // update ligne
      const updated = await prisma.invoiceLigne.update({
        where: { id },
        data: {
          ...dto,
          totalPrice: newTotalPrice,
        },
      });

      // recalcul invoice
      const invoice = await prisma.invoice.findUnique({
        where: { id: old.invoiceId },
      });

      const newSubTotal =
        (invoice?.subTotal || 0) - old.totalPrice + newTotalPrice;

      const taxTotal = (newSubTotal * 19) / 100;
      const total = newSubTotal + taxTotal;

      await prisma.invoice.update({
        where: { id: old.invoiceId },
        data: {
          subTotal: newSubTotal,
          taxTotal,
          total,
          balanceDue: total - (invoice?.amountPaid || 0),
        },
      });

      return updated;
    });
  }

  // ✅ DELETE (décrément)
  async remove(id: number) {

    return await this.prisma.$transaction(async (prisma) => {

      const ligne = await prisma.invoiceLigne.findUnique({
        where: { id },
      });

      if (!ligne) throw new Error('Line not found');

      // supprimer ligne
      await prisma.invoiceLigne.delete({
        where: { id },
      });

      const invoice = await prisma.invoice.findUnique({
        where: { id: ligne.invoiceId },
      });

      const newSubTotal = (invoice?.subTotal || 0) - ligne.totalPrice;
      const taxTotal = (newSubTotal * 19) / 100;
      const total = newSubTotal + taxTotal;

      await prisma.invoice.update({
        where: { id: ligne.invoiceId },
        data: {
          subTotal: newSubTotal,
          taxTotal,
          total,
          balanceDue: total - (invoice?.amountPaid || 0),
        },
      });

      return { message: 'Deleted successfully' };
    });
  }
}