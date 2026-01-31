-- CreateTable
CREATE TABLE "Anuncio" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Anuncio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnuncioImage" (
    "id" TEXT NOT NULL,
    "anuncioId" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secureUrl" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "bytes" INTEGER,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnuncioImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Anuncio_status_idx" ON "Anuncio"("status");

-- CreateIndex
CREATE INDEX "Anuncio_cidade_idx" ON "Anuncio"("cidade");

-- CreateIndex
CREATE UNIQUE INDEX "AnuncioImage_publicId_key" ON "AnuncioImage"("publicId");

-- CreateIndex
CREATE INDEX "AnuncioImage_anuncioId_idx" ON "AnuncioImage"("anuncioId");

-- CreateIndex
CREATE INDEX "AnuncioImage_isPrimary_idx" ON "AnuncioImage"("isPrimary");

-- AddForeignKey
ALTER TABLE "AnuncioImage" ADD CONSTRAINT "AnuncioImage_anuncioId_fkey" FOREIGN KEY ("anuncioId") REFERENCES "Anuncio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
