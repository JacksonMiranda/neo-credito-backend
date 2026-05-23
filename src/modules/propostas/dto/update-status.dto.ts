import { PropostaStatus } from '@prisma/client';
import { IsEnum, IsString, MinLength, ValidateIf } from 'class-validator';

export class UpdateStatusDto {
  @IsEnum(PropostaStatus)
  status: PropostaStatus;

  @ValidateIf((dto: UpdateStatusDto) => dto.status === PropostaStatus.REPROVADA)
  @IsString()
  @MinLength(3)
  motivoReprovacao?: string;
}
