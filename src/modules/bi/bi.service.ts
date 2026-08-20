import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BiService {
  constructor(
    private prisma: PrismaService,
  ) {}

  // ============================================================
  // 1. RÉCUPÉRATION ET AGRÉGATION DES DONNÉES DU CLIENT
  // ============================================================
  async getDashboard(userId: number) {

    /*
     * Récupération en parallèle des différentes données
     * nécessaires pour construire le tableau de bord BI.
     *
     * Promise.all permet d'exécuter les requêtes simultanément
     * afin de réduire le temps global de réponse.
     */
    const [
      invoices,
      projects,
      payments,
      purchaseOrders,
      deliveryNotes,
      ocrDocuments,
    ] = await Promise.all([

      // -----------------------------
      // Récupération des factures
      // -----------------------------
      this.prisma.invoice.findMany({
        where: {
          contact: {
            userId,
          },
        },
      }),

      // -----------------------------
      // Récupération des projets
      // -----------------------------
      this.prisma.project.findMany({
        where: {
          contact: {
            userId,
          },
        },
      }),

      // -----------------------------
      // Récupération des paiements
      // -----------------------------
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

      // -----------------------------
      // Récupération des bons de commande
      // -----------------------------
      this.prisma.purchaseOrder.findMany({
        where: {
          contact: {
            userId,
          },
        },
      }),

      // -----------------------------
      // Récupération des bons de livraison
      // -----------------------------
      this.prisma.deliveryNote.findMany({
        where: {
          contact: {
            userId,
          },
        },
      }),

      // -----------------------------
      // Récupération des documents analysés par OCR
      // -----------------------------
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

    // ============================================================
    // 2. ANALYSE FINANCIÈRE
    // ============================================================

    /*
     * Création d'une Map permettant d'associer chaque facture
     * au montant total de ses paiements.
     *
     * Exemple :
     * Facture 1 → 1500 €
     * Facture 2 → 800 €
     */
    const paymentsByInvoice = new Map<number, number>();

    payments.forEach((payment) => {
      const currentAmount =
        paymentsByInvoice.get(payment.invoiceId) || 0;

      paymentsByInvoice.set(
        payment.invoiceId,
        currentAmount + payment.amount,
      );
    });

    // -----------------------------
    // Chiffre d'affaires total
    // -----------------------------
    const totalRevenue = invoices.reduce(
      (sum, invoice) => sum + invoice.total,
      0,
    );

    // -----------------------------
    // Initialisation des indicateurs financiers
    // -----------------------------
    let totalPaid = 0;
    let totalUnpaid = 0;
    let paidInvoices = 0;
    let unpaidInvoices = 0;

    /*
     * Parcours des factures afin de calculer :
     * - le montant payé
     * - le montant restant
     * - le nombre de factures payées
     * - le nombre de factures non payées
     */
    invoices.forEach((invoice) => {

      const paidAmount =
        paymentsByInvoice.get(invoice.id) || 0;

      const balanceDue = Math.max(
        0,
        invoice.total - paidAmount,
      );

      totalPaid += paidAmount;
      totalUnpaid += balanceDue;

      if (invoice.status === 'PAID') {
        paidInvoices++;
      } else {
        unpaidInvoices++;
      }
    });

    // ============================================================
    // 3. ANALYSE DES PAIEMENTS
    // ============================================================

    /*
     * Calcul du montant total de tous les paiements
     * enregistrés pour le client.
     */
    const totalPayments = payments.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    );

    // ============================================================
    // 4. ANALYSE DES PROJETS
    // ============================================================

    /*
     * Nombre total de projets du client.
     */
    const totalProjects = projects.length;

    /*
     * Nombre de projets terminés.
     */
    const completedProjects =
      projects.filter(
        (project) =>
          project.status === 'COMPLETED',
      ).length;

    /*
     * Nombre de projets actuellement en cours.
     */
    const activeProjects =
      projects.filter(
        (project) =>
          project.status === 'IN_PROGRESS',
      ).length;

    /*
     * Nombre de projets en attente.
     */
    const pendingProjects =
      projects.filter(
        (project) =>
          project.status === 'PENDING',
      ).length;

    // ============================================================
    // 5. ANALYSE DES DOCUMENTS OCR
    // ============================================================

    /*
     * Nombre total de documents ayant fait l'objet
     * d'une analyse OCR.
     */
    const totalDocuments =
      ocrDocuments.length;

    /*
     * Nombre de factures analysées par OCR.
     */
    const invoicesOcr =
      ocrDocuments.filter(
        (doc) =>
          doc.documentType === 'invoice',
      ).length;

    /*
     * Nombre de devis analysés par OCR.
     */
    const quotesOcr =
      ocrDocuments.filter(
        (doc) =>
          doc.documentType === 'quote',
      ).length;

    /*
     * Nombre de projets analysés par OCR.
     */
    const projectsOcr =
      ocrDocuments.filter(
        (doc) =>
          doc.documentType === 'project',
      ).length;

    // ============================================================
    // 6. ANALYSE DES RISQUES PAR L'IA
    // ============================================================

    /*
     * Initialisation des compteurs de priorité.
     *
     * L'IA attribue à chaque document une priorité :
     * - HIGH
     * - MEDIUM
     * - LOW
     */
    let highRisk = 0;
    let mediumRisk = 0;
    let lowRisk = 0;

    /*
     * Parcours des documents OCR pour déterminer
     * le niveau de risque détecté par l'IA.
     */
    ocrDocuments.forEach((doc: any) => {

      const priority =
        doc.aiInsights?.priority;

      if (priority === 'HIGH') {
        highRisk++;
      } else if (priority === 'MEDIUM') {
        mediumRisk++;
      } else if (priority === 'LOW') {
        lowRisk++;
      }
    });

    // ============================================================
    // 7. CONSTRUCTION DES INDICATEURS LOGISTIQUES
    // ============================================================

    /*
     * Les indicateurs logistiques permettent de suivre :
     * - les bons de commande
     * - les bons de livraison
     */
    const logistics = {
      purchaseOrders: purchaseOrders.length,
      deliveryNotes: deliveryNotes.length,
    };

    // ============================================================
    // 8. CONSTRUCTION DE LA RÉPONSE DU DASHBOARD
    // ============================================================

    /*
     * Regroupement de toutes les informations calculées
     * dans une structure organisée par domaine.
     *
     * Cette réponse est ensuite consommée par le frontend
     * afin d'afficher les statistiques et indicateurs BI.
     */
    return {

      // -----------------------------
      // Indicateurs financiers
      // -----------------------------
      finance: {
        totalRevenue,
        totalPaid,
        totalUnpaid,
        paidInvoices,
        unpaidInvoices,
      },

      // -----------------------------
      // Indicateurs des projets
      // -----------------------------
      projects: {
        totalProjects,
        completedProjects,
        activeProjects,
        pendingProjects,
      },

      // -----------------------------
      // Indicateurs des paiements
      // -----------------------------
      payments: {
        totalPayments,
        count: payments.length,
      },

      // -----------------------------
      // Indicateurs logistiques
      // -----------------------------
      logistics,

      // -----------------------------
      // Indicateurs OCR
      // -----------------------------
      ocr: {
        totalDocuments,
        invoicesOcr,
        quotesOcr,
        projectsOcr,
      },

      // -----------------------------
      // Indicateurs de risque IA
      // -----------------------------
      ai: {
        highRisk,
        mediumRisk,
        lowRisk,
      },
    };
  }
}