import { PropostaStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ListPropostasDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsEnum(PropostaStatus)
  status?: PropostaStatus;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => String(value).replace(/\D/g, ''))
  clienteCpf?: string;
}
