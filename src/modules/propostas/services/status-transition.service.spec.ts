import { UnprocessableEntityException } from '@nestjs/common';
import { PropostaStatus } from '@prisma/client';
import { StatusTransitionService } from './status-transition.service';

describe('StatusTransitionService', () => {
  const service = new StatusTransitionService();

  it('permite enviar proposta em rascunho para analise', () => {
    expect(() =>
      service.assertCanTransition(
        PropostaStatus.RASCUNHO,
        PropostaStatus.EM_ANALISE,
      ),
    ).not.toThrow();
  });

  it('permite aprovar proposta em analise', () => {
    expect(() =>
      service.assertCanTransition(
        PropostaStatus.EM_ANALISE,
        PropostaStatus.APROVADA,
      ),
    ).not.toThrow();
  });

  it('permite reprovar proposta em analise', () => {
    expect(() =>
      service.assertCanTransition(
        PropostaStatus.EM_ANALISE,
        PropostaStatus.REPROVADA,
      ),
    ).not.toThrow();
  });

  it('permite cancelar proposta em rascunho ou em analise', () => {
    expect(() =>
      service.assertCanTransition(
        PropostaStatus.RASCUNHO,
        PropostaStatus.CANCELADA,
      ),
    ).not.toThrow();

    expect(() =>
      service.assertCanTransition(
        PropostaStatus.EM_ANALISE,
        PropostaStatus.CANCELADA,
      ),
    ).not.toThrow();
  });

  it('recusa transicao fora do fluxo previsto', () => {
    expect(() =>
      service.assertCanTransition(
        PropostaStatus.RASCUNHO,
        PropostaStatus.APROVADA,
      ),
    ).toThrow(UnprocessableEntityException);
  });

  it('recusa cancelar propostas em status terminal', () => {
    expect(() =>
      service.assertCanTransition(
        PropostaStatus.APROVADA,
        PropostaStatus.CANCELADA,
      ),
    ).toThrow(UnprocessableEntityException);
  });
});
