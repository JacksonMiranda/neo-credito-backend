import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreatePropostaDto } from './dto/create-proposta.dto';
import { PropostaResponseDto } from './dto/proposta-response.dto';
import { PropostasService } from './propostas.service';

@Controller('propostas')
@UseGuards(JwtAuthGuard)
export class PropostasController {
  constructor(private readonly propostasService: PropostasService) {}

  @Post()
  create(
    @Body() dto: CreatePropostaDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PropostaResponseDto> {
    return this.propostasService.create(dto, user);
  }
}
