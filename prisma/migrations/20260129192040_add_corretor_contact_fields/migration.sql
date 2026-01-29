-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('MASCULINO', 'FEMININO', 'OUTRO', 'PREFIRO_NAO_INFORMAR');

-- AlterTable
ALTER TABLE "Corretor" ADD COLUMN     "cpf" TEXT,
ADD COLUMN     "endereco" TEXT,
ADD COLUMN     "rg" TEXT,
ADD COLUMN     "sexo" "Sexo",
ADD COLUMN     "telefone" TEXT;
