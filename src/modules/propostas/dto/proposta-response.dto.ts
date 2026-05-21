import { PropostaStatus } from '@prisma/client';

type CorbanSummaryDto = {
  id: string;
  email: string;
};

export type PropostaResponseDto = {
  id: string;
  clienteNome: string;
  clienteCpf: string;
  clienteRenda: number;
  valorSolicitado: number;
  numeroParcelas: number;
  taxaJuros: number;
  valorParcela: number;
  totalAPagar: number;
  status: PropostaStatus;
  motivoReprovacao: string | null;
  corbanId: string;
  corban: CorbanSummaryDto;
  criadoEm: Date;
  atualizadoEm: Date;
};
