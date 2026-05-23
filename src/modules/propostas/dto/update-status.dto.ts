import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PropostaStatus } from '@prisma/client';
import { IsEnum, IsString, MinLength, ValidateIf } from 'class-validator';

export class UpdateStatusDto {
  @ApiProperty({
    description: 'Novo status da proposta.',
    enum: PropostaStatus,
    example: PropostaStatus.EM_ANALISE,
  })
  @IsEnum(PropostaStatus)
  status: PropostaStatus;

  @ApiPropertyOptional({
    description: 'Obrigatorio quando o status informado for REPROVADA.',
    example: 'Score insuficiente',
    minLength: 3,
  })
  @ValidateIf((dto: UpdateStatusDto) => dto.status === PropostaStatus.REPROVADA)
  @IsString()
  @MinLength(3)
  motivoReprovacao?: string;
}
