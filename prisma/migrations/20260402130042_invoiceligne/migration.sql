-- CreateTable
CREATE TABLE "InvoiceLigne" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "unity" TEXT NOT NULL,
    "invoiceId" INTEGER NOT NULL,

    CONSTRAINT "InvoiceLigne_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "InvoiceLigne" ADD CONSTRAINT "InvoiceLigne_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
