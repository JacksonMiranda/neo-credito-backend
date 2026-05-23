import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreatePropostaDto } from './dto/create-proposta.dto';
import { ListPropostasDto } from './dto/list-propostas.dto';
import { PropostaResponseDto } from './dto/proposta-response.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { PropostasService } from './propostas.service';

@Controller('propostas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CORBAN, UserRole.OPERADOR)
export class PropostasController {
  constructor(private readonly propostasService: PropostasService) {}

  @Post()
  create(
    @Body() dto: CreatePropostaDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PropostaResponseDto> {
    return this.propostasService.create(dto, user);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListPropostasDto,
  ): Promise<{
    data: PropostaResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.propostasService.findAll(user, query);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PropostaResponseDto> {
    return this.propostasService.findOne(id, user);
  }

  @Patch(':id/status')
  @Roles(UserRole.OPERADOR)
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PropostaResponseDto> {
    return this.propostasService.updateStatus(id, dto, user);
  }

  @Delete(':id')
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PropostaResponseDto> {
    return this.propostasService.cancel(id, user);
  }
}
