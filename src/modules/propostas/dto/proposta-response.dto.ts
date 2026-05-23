import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PropostaStatus } from '@prisma/client';

class CorbanSummaryDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'corban1@neocredito.com.br' })
  email: string;
}

export class PropostaResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Maria da Silva' })
  clienteNome: string;

  @ApiProperty({ example: '11144477735' })
  clienteCpf: string;

  @ApiProperty({ example: 6500 })
  clienteRenda: number;

  @ApiProperty({ example: 10000 })
  valorSolicitado: number;

  @ApiProperty({ example: 12 })
  numeroParcelas: number;

  @ApiProperty({ example: 1.89 })
  taxaJuros: number;

  @ApiProperty({ example: 939.22 })
  valorParcela: number;

  @ApiProperty({ example: 11270.64 })
  totalAPagar: number;

  @ApiProperty({ enum: PropostaStatus, example: PropostaStatus.RASCUNHO })
  status: PropostaStatus;

  @ApiPropertyOptional({
    example: 'Score insuficiente',
    nullable: true,
  })
  motivoReprovacao: string | null;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  corbanId: string;

  @ApiProperty({ type: CorbanSummaryDto })
  corban: CorbanSummaryDto;

  @ApiProperty({ example: '2026-05-23T12:00:00.000Z' })
  criadoEm: Date;

  @ApiProperty({ example: '2026-05-23T12:00:00.000Z' })
  atualizadoEm: Date;
}
