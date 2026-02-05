-- AlterTable
ALTER TABLE "Anuncio" ADD COLUMN     "criadoPorId" TEXT;

-- CreateIndex
CREATE INDEX "Anuncio_criadoPorId_idx" ON "Anuncio"("criadoPorId");

-- AddForeignKey
ALTER TABLE "Anuncio" ADD CONSTRAINT "Anuncio_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
