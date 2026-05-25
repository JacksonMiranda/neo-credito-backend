import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreatePropostaDto {
  @ApiProperty({
    description: 'Nome completo do cliente da proposta.',
    minLength: 3,
    maxLength: 120,
    example: 'Maria da Silva',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  clienteNome: string;

  @ApiProperty({
    description: 'CPF do cliente, aceito com ou sem mascara.',
    example: '111.444.777-35',
  })
  @IsString()
  @Transform(({ value }) => String(value).replace(/\D/g, ''))
  @Matches(/^\d{11}$/, {
    message: 'clienteCpf deve conter 11 digitos numericos',
  })
  clienteCpf: string;

  @ApiProperty({
    description: 'Renda mensal declarada pelo cliente.',
    example: 6500,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  clienteRenda: number;

  @ApiProperty({
    description: 'Valor solicitado para a proposta de credito.',
    example: 10000,
    minimum: 500,
    maximum: 50000,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(500)
  @Max(50000)
  valorSolicitado: number;

  @ApiProperty({
    description: 'Quantidade de parcelas da proposta.',
    enum: [6, 12, 18, 24, 36],
    example: 12,
  })
  @Type(() => Number)
  @IsIn([6, 12, 18, 24, 36])
  numeroParcelas: number;

  @ApiPropertyOptional({
    description: 'Obrigatorio para OPERADOR criar proposta para um CORBAN.',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  corbanId?: string;
}
