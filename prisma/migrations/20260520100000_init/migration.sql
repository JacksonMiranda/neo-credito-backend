CREATE TYPE "UserRole" AS ENUM ('CORBAN', 'OPERADOR');

CREATE TYPE "PropostaStatus" AS ENUM ('RASCUNHO', 'EM_ANALISE', 'APROVADA', 'REPROVADA', 'CANCELADA');

CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "propostas" (
    "id" TEXT NOT NULL,
    "clienteNome" TEXT NOT NULL,
    "clienteCpf" TEXT NOT NULL,
    "clienteRenda" DECIMAL(12,2) NOT NULL,
    "valorSolicitado" DECIMAL(12,2) NOT NULL,
    "numeroParcelas" INTEGER NOT NULL,
    "taxaMensal" DECIMAL(5,2) NOT NULL,
    "valorParcela" DECIMAL(12,2) NOT NULL,
    "totalAPagar" DECIMAL(12,2) NOT NULL,
    "status" "PropostaStatus" NOT NULL DEFAULT 'RASCUNHO',
    "motivoReprovacao" TEXT,
    "corbanId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "propostas_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "propostas_reprovada_motivo_check" CHECK ("status" <> 'REPROVADA' OR "motivoReprovacao" IS NOT NULL)
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE INDEX "propostas_corbanId_idx" ON "propostas"("corbanId");

CREATE INDEX "propostas_status_idx" ON "propostas"("status");

ALTER TABLE "propostas" ADD CONSTRAINT "propostas_corbanId_fkey" FOREIGN KEY ("corbanId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
