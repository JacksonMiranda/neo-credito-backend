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
import { IsCpf } from '../../../shared/validation/cpf.validator';

export class CreatePropostaDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  clienteNome: string;

  @IsString()
  @Transform(({ value }) => String(value).replace(/\D/g, ''))
  @Matches(/^\d{11}$/, {
    message: 'clienteCpf deve conter 11 digitos numericos',
  })
  @IsCpf({ message: 'clienteCpf deve ser um CPF valido' })
  clienteCpf: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  clienteRenda: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(500)
  @Max(50000)
  valorSolicitado: number;

  @Type(() => Number)
  @IsIn([6, 12, 18, 24, 36])
  numeroParcelas: number;

  @IsOptional()
  @IsUUID()
  corbanId?: string;
}
