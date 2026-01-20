/*
  Warnings:

  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - Added the required column `nome` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "StatusFuncionario" AS ENUM ('ATIVO', 'INATIVO');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NOVO', 'CONTATADO', 'QUALIFICADO', 'CONVERTIDO', 'PERDIDO');

-- CreateEnum
CREATE TYPE "TipoPropriedade" AS ENUM ('CASA_PRAIA', 'APARTAMENTO_PRAIA', 'SITIO', 'CHACARA', 'CASA_CAMPO', 'COBERTURA', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusPropriedade" AS ENUM ('AGUARDANDO_APROVACAO', 'ATIVO', 'INATIVO', 'REJEITADO');

-- CreateEnum
CREATE TYPE "CategoriaTransacao" AS ENUM ('RESERVA', 'COMISSAO_CORRETOR', 'PAGAMENTO_PROPRIETARIO', 'TAXA_PLATAFORMA', 'CANCELAMENTO', 'TAXA_LIMPEZA', 'TAXA_SERVICO', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoTransacao" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateEnum
CREATE TYPE "StatusTransacao" AS ENUM ('PAGO', 'PENDENTE', 'CANCELADO', 'PROCESSANDO');

-- CreateEnum
CREATE TYPE "StatusReserva" AS ENUM ('CONFIRMADA', 'PENDENTE', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StatusVisita" AS ENUM ('AGENDADA', 'REALIZADA', 'CANCELADA');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "name",
ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "nome" TEXT NOT NULL,
ADD COLUMN     "refreshToken" TEXT,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "Funcionario" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cpf" TEXT,
    "telefone" TEXT,
    "status" "StatusFuncionario" NOT NULL DEFAULT 'ATIVO',
    "dataCadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Funcionario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Corretor" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "nome" TEXT NOT NULL,
    "creci" TEXT,
    "totalVendas" INTEGER DEFAULT 0,
    "especialidade" TEXT,
    "comissaoTotal" DECIMAL(10,2) DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Corretor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "origem" TEXT,
    "interesse" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NOVO',
    "dataContato" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anotacoes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropriedadeTemporada" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" "TipoPropriedade" NOT NULL,
    "endereco" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "valorDiaria" DECIMAL(10,2) NOT NULL,
    "valorDiariaFimSemana" DECIMAL(10,2) NOT NULL,
    "status" "StatusPropriedade" NOT NULL DEFAULT 'AGUARDANDO_APROVACAO',
    "proprietario" TEXT,
    "capacidadeHospedes" INTEGER NOT NULL,
    "quartos" INTEGER NOT NULL,
    "camas" INTEGER NOT NULL,
    "banheiros" INTEGER NOT NULL,
    "areaTotal" DOUBLE PRECISION,
    "minimoNoites" INTEGER NOT NULL DEFAULT 1,
    "dataEnvio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imagens" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropriedadeTemporada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transacao" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" "CategoriaTransacao" NOT NULL,
    "tipo" "TipoTransacao" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "status" "StatusTransacao" NOT NULL DEFAULT 'PENDENTE',
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataVencimento" TIMESTAMP(3),
    "metodoPagamento" TEXT,
    "propriedadeId" TEXT,
    "corretorId" TEXT,
    "hospedeId" TEXT,

    CONSTRAINT "Transacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reserva" (
    "id" TEXT NOT NULL,
    "propriedadeId" TEXT NOT NULL,
    "hospede" TEXT NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "valorTotal" DECIMAL(10,2) NOT NULL,
    "status" "StatusReserva" NOT NULL DEFAULT 'PENDENTE',

    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visita" (
    "id" TEXT NOT NULL,
    "propriedadeId" TEXT NOT NULL,
    "corretorId" TEXT NOT NULL,
    "cliente" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "status" "StatusVisita" NOT NULL DEFAULT 'AGENDADA',

    CONSTRAINT "Visita_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Funcionario_userId_key" ON "Funcionario"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Corretor_userId_key" ON "Corretor"("userId");

-- AddForeignKey
ALTER TABLE "Funcionario" ADD CONSTRAINT "Funcionario_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Corretor" ADD CONSTRAINT "Corretor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transacao" ADD CONSTRAINT "Transacao_propriedadeId_fkey" FOREIGN KEY ("propriedadeId") REFERENCES "PropriedadeTemporada"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transacao" ADD CONSTRAINT "Transacao_corretorId_fkey" FOREIGN KEY ("corretorId") REFERENCES "Corretor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_propriedadeId_fkey" FOREIGN KEY ("propriedadeId") REFERENCES "PropriedadeTemporada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visita" ADD CONSTRAINT "Visita_propriedadeId_fkey" FOREIGN KEY ("propriedadeId") REFERENCES "PropriedadeTemporada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visita" ADD CONSTRAINT "Visita_corretorId_fkey" FOREIGN KEY ("corretorId") REFERENCES "Corretor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
