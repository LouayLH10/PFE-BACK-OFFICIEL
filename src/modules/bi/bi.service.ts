import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BiService {

  constructor(
    private prisma: PrismaService,
  ) {}

async getDashboard(userId: number) {
  const [
    invoices,
    projects,
    payments,
    purchaseOrders,
    deliveryNotes,
    ocrDocuments,
  ] = await Promise.all([
    this.prisma.invoice.findMany({
      where: {
        contact: {
          userId,
        },
      },
    }),

    this.prisma.project.findMany({
      where: {
        contact: {
          userId,
        },
      },
    }),

    this.prisma.payment.findMany({
      where: {
        invoice: {
          contact: {
            userId,
          },
        },
      },
      include: {
        invoice: true,
      },
      orderBy: {
        paymentDate: 'desc',
      },
    }),

    this.prisma.purchaseOrder.findMany({
      where: {
        contact: {
          userId,
        },
      },
    }),

    this.prisma.deliveryNote.findMany({
      where: {
        contact: {
          userId,
        },
      },
    }),

    this.prisma.ocrDocument.findMany({
      where: {
        OR: [
          {
            invoice: {
              contact: {
                userId,
              },
            },
          },
          {
            quote: {
              contact: {
                userId,
              },
            },
          },
          {
            project: {
              contact: {
                userId,
              },
            },
          },
        ],
      },
    }),
  ]);

  // =====================================
  // FINANCE
  // =====================================

  const paymentsByInvoice = new Map<number, number>();

  payments.forEach((payment) => {
    const currentAmount =
      paymentsByInvoice.get(payment.invoiceId) || 0;

    paymentsByInvoice.set(
      payment.invoiceId,
      currentAmount + payment.amount,
    );
  });

  const totalRevenue = invoices.reduce(
    (sum, invoice) => sum + invoice.total,
    0,
  );

  let totalPaid = 0;
  let totalUnpaid = 0;

  let paidInvoices = 0;
  let unpaidInvoices = 0;

  invoices.forEach((invoice) => {
    const paidAmount =
      paymentsByInvoice.get(invoice.id) || 0;

    const balanceDue = Math.max(
      0,
      invoice.total - paidAmount,
    );

    totalPaid += paidAmount;
    totalUnpaid += balanceDue;

    if (invoice.status==="PAID") {
      paidInvoices++;
    } else {
      unpaidInvoices++;
    }
  });

  // =====================================
  // PAYMENTS
  // =====================================

  const totalPayments = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );

  // =====================================
  // PROJECTS
  // =====================================

  const totalProjects = projects.length;

  const completedProjects =
    projects.filter(
      (project) =>
        project.status === 'COMPLETED',
    ).length;

  const activeProjects =
    projects.filter(
      (project) =>
        project.status === 'IN_PROGRESS',
    ).length;

  const pendingProjects =
    projects.filter(
      (project) =>
        project.status === 'PENDING',
    ).length;

  // =====================================
  // OCR
  // =====================================

  const totalDocuments =
    ocrDocuments.length;

  const invoicesOcr =
    ocrDocuments.filter(
      (doc) =>
        doc.documentType === 'invoice',
    ).length;

  const quotesOcr =
    ocrDocuments.filter(
      (doc) =>
        doc.documentType === 'quote',
    ).length;

  const projectsOcr =
    ocrDocuments.filter(
      (doc) =>
        doc.documentType === 'project',
    ).length;

  // =====================================
  // AI PRIORITIES
  // =====================================

  let highRisk = 0;
  let mediumRisk = 0;
  let lowRisk = 0;

  ocrDocuments.forEach((doc: any) => {
    const priority =
      doc.aiInsights?.priority;

    if (priority === 'HIGH') {
      highRisk++;
    } else if (
      priority === 'MEDIUM'
    ) {
      mediumRisk++;
    } else if (
      priority === 'LOW'
    ) {
      lowRisk++;
    }
  });

  // =====================================
  // RETURN
  // =====================================

  return {
    finance: {
      totalRevenue,
      totalPaid,
      totalUnpaid,
      paidInvoices,
      unpaidInvoices,
    },

    projects: {
      totalProjects,
      completedProjects,
      activeProjects,
      pendingProjects,
    },

    payments: {
      totalPayments,
      count: payments.length,
    },

    logistics: {
      purchaseOrders:
        purchaseOrders.length,
      deliveryNotes:
        deliveryNotes.length,
    },

    ocr: {
      totalDocuments,
      invoicesOcr,
      quotesOcr,
      projectsOcr,
    },

    ai: {
      highRisk,
      mediumRisk,
      lowRisk,
    },
  };
} 
}