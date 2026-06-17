-- CreateTable
CREATE TABLE "OcrDocument" (
    "id" SERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "extractedText" TEXT,
    "aiSummary" TEXT,
    "extractedJson" JSONB,
    "aiInsights" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "processingTime" DOUBLE PRECISION,
    "confidenceScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "invoiceId" INTEGER,
    "quoteId" INTEGER,
    "projectId" INTEGER,
    "paymentId" INTEGER,
    "deliveryNoteId" INTEGER,
    "purchaseOrderId" INTEGER,

    CONSTRAINT "OcrDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OcrAnalytics" (
    "id" SERIAL NOT NULL,
    "totalAmount" DOUBLE PRECISION,
    "tva" DOUBLE PRECISION,
    "currency" TEXT,
    "invoiceNumber" TEXT,
    "clientName" TEXT,
    "paymentStatus" TEXT,
    "invoiceDate" TIMESTAMP(3),
    "extractedJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ocrDocumentId" INTEGER NOT NULL,

    CONSTRAINT "OcrAnalytics_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OcrDocument" ADD CONSTRAINT "OcrDocument_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcrDocument" ADD CONSTRAINT "OcrDocument_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcrDocument" ADD CONSTRAINT "OcrDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcrDocument" ADD CONSTRAINT "OcrDocument_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcrDocument" ADD CONSTRAINT "OcrDocument_deliveryNoteId_fkey" FOREIGN KEY ("deliveryNoteId") REFERENCES "DeliveryNote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcrDocument" ADD CONSTRAINT "OcrDocument_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcrAnalytics" ADD CONSTRAINT "OcrAnalytics_ocrDocumentId_fkey" FOREIGN KEY ("ocrDocumentId") REFERENCES "OcrDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
