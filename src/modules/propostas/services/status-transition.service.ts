import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { PropostaStatus } from '@prisma/client';

const ALLOWED_TRANSITIONS: Record<PropostaStatus, PropostaStatus[]> = {
  [PropostaStatus.RASCUNHO]: [PropostaStatus.EM_ANALISE],
  [PropostaStatus.EM_ANALISE]: [
    PropostaStatus.APROVADA,
    PropostaStatus.REPROVADA,
  ],
  [PropostaStatus.APROVADA]: [],
  [PropostaStatus.REPROVADA]: [],
  [PropostaStatus.CANCELADA]: [],
};

@Injectable()
export class StatusTransitionService {
  assertCanTransition(
    currentStatus: PropostaStatus,
    nextStatus: PropostaStatus,
  ): void {
    const allowedTransitions = ALLOWED_TRANSITIONS[currentStatus];

    if (!allowedTransitions.includes(nextStatus)) {
      throw new UnprocessableEntityException({
        error: `Transicao de status invalida: ${currentStatus} -> ${nextStatus}`,
        details: {
          currentStatus,
          nextStatus,
          allowed: allowedTransitions,
        },
      });
    }
  }
}
