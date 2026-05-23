CREATE TABLE "historico_status_propostas" (
    "id" TEXT NOT NULL,
    "propostaId" TEXT NOT NULL,
    "statusAnterior" "PropostaStatus" NOT NULL,
    "statusNovo" "PropostaStatus" NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "perfilUsuario" "UserRole" NOT NULL,
    "motivo" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_status_propostas_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "historico_status_propostas_propostaId_idx" ON "historico_status_propostas"("propostaId");

CREATE INDEX "historico_status_propostas_usuarioId_idx" ON "historico_status_propostas"("usuarioId");

ALTER TABLE "historico_status_propostas" ADD CONSTRAINT "historico_status_propostas_propostaId_fkey" FOREIGN KEY ("propostaId") REFERENCES "propostas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "historico_status_propostas" ADD CONSTRAINT "historico_status_propostas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
