/*
  Warnings:

  - Added the required column `page_end` to the `document_chunks` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "document_chunks" ADD COLUMN     "page_end" INTEGER NOT NULL,
ADD COLUMN     "page_start" INTEGER;
