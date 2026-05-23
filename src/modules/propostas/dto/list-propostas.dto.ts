import { ApiPropertyOptional } from '@nestjs/swagger';
import { PropostaStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ListPropostasDto {
  @ApiPropertyOptional({
    description: 'Pagina da listagem.',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Quantidade de itens por pagina.',
    example: 20,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Filtra propostas pelo status.',
    enum: PropostaStatus,
    example: PropostaStatus.RASCUNHO,
  })
  @IsOptional()
  @IsEnum(PropostaStatus)
  status?: PropostaStatus;

  @ApiPropertyOptional({
    description: 'CPF do cliente, aceito com ou sem mascara.',
    example: '111.444.777-35',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => String(value).replace(/\D/g, ''))
  clienteCpf?: string;
}
