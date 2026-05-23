import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 'Mensagem de erro' })
  error: string;

  @ApiProperty({ example: {} })
  details: Record<string, unknown>;
}

export const ERROR_RESPONSE_EXAMPLES = {
  validation: {
    error: 'Erro de validacao',
    details: {
      message: ['campo deve ser informado'],
    },
  },
  unauthorized: {
    error: 'Token invalido',
    details: {},
  },
  forbidden: {
    error: 'Forbidden resource',
    details: {},
  },
  notFound: {
    error: 'Proposta nao encontrada',
    details: {
      id: '123e4567-e89b-12d3-a456-426614174000',
    },
  },
  proposalForbidden: {
    error: 'Acesso negado para esta proposta',
    details: {},
  },
  unprocessable: {
    error: 'Transicao de status invalida: APROVADA -> CANCELADA',
    details: {
      currentStatus: 'APROVADA',
      nextStatus: 'CANCELADA',
      allowed: [],
    },
  },
};
