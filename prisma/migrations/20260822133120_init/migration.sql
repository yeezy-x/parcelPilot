CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('ENTERPRISE', 'GROWTH', 'STANDARD');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('BOOKED', 'PICKED_UP', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'CLOSED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "TicketSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "EscalationStatus" AS ENUM ('CREATED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('POLICY', 'SOP', 'AGREEMENT', 'PRODUCT_DOC');

-- CreateEnum
CREATE TYPE "DocumentAuthorityStatus" AS ENUM ('CURRENT', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "DocumentProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');


-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "account_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plan" "Plan" NOT NULL,
    "status" "AccountStatus" NOT NULL,
    "csm" TEXT,
    "contract_file" TEXT,
    "premium_support" BOOLEAN,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "order_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "carrier" TEXT,
    "status" "OrderStatus" NOT NULL,
    "booked_at" TIMESTAMP(3),
    "pickup_window_start" TIMESTAMP(3),
    "pickup_window_end" TIMESTAMP(3),
    "pickup_actual_at" TIMESTAMP(3),
    "shipment_fee_inr" INTEGER NOT NULL,
    "carrier_fault" BOOLEAN,
    "customer_fault" BOOLEAN,
    "cancellation_requested_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" UUID NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "order_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "TicketStatus" NOT NULL,
    "severity" "TicketSeverity",
    "subject" TEXT,
    "description" TEXT,
    "channel" TEXT,
    "assigned_to" TEXT,
    "last_customer_message_at" TIMESTAMP(3),
    "historical_resolution" TEXT,
    "context_only" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escalations" (
    "id" UUID NOT NULL,
    "escalation_id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "severity" "TicketSeverity" NOT NULL,
    "summary" TEXT NOT NULL,
    "status" "EscalationStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "escalations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "source_file" TEXT NOT NULL,
    "doc_type" "DocumentType" NOT NULL,
    "authority_status" "DocumentAuthorityStatus" NOT NULL,
    "processing_status" "DocumentProcessingStatus" NOT NULL,
    "account_id" TEXT,
    "effective_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_chunks" (
    "id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "chunk_text" TEXT NOT NULL,
    "embedding" vector(768),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_account_id_key" ON "accounts"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_id_key" ON "orders"("order_id");

-- CreateIndex
CREATE INDEX "orders_account_id_idx" ON "orders"("account_id");

-- CreateIndex
CREATE INDEX "orders_account_id_order_id_idx" ON "orders"("account_id", "order_id");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_ticket_id_key" ON "tickets"("ticket_id");

-- CreateIndex
CREATE INDEX "tickets_account_id_idx" ON "tickets"("account_id");

-- CreateIndex
CREATE INDEX "tickets_account_id_ticket_id_idx" ON "tickets"("account_id", "ticket_id");

-- CreateIndex
CREATE INDEX "tickets_order_id_idx" ON "tickets"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "escalations_escalation_id_key" ON "escalations"("escalation_id");

-- CreateIndex
CREATE INDEX "escalations_account_id_idx" ON "escalations"("account_id");

-- CreateIndex
CREATE INDEX "escalations_ticket_id_idx" ON "escalations"("ticket_id");

-- CreateIndex
CREATE UNIQUE INDEX "documents_source_file_key" ON "documents"("source_file");

-- CreateIndex
CREATE INDEX "documents_account_id_idx" ON "documents"("account_id");

-- CreateIndex
CREATE INDEX "documents_authority_status_idx" ON "documents"("authority_status");

-- CreateIndex
CREATE INDEX "documents_doc_type_idx" ON "documents"("doc_type");

-- CreateIndex
CREATE INDEX "document_chunks_document_id_idx" ON "document_chunks"("document_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_chunks_document_id_chunk_index_key" ON "document_chunks"("document_id", "chunk_index");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("order_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalations" ADD CONSTRAINT "escalations_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("ticket_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalations" ADD CONSTRAINT "escalations_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
