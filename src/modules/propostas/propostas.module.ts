import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { PropostasController } from './propostas.controller';
import { PropostasService } from './propostas.service';
import { PropostaCalculatorService } from './services/proposta-calculator.service';

@Module({
  imports: [UsersModule],
  controllers: [PropostasController],
  providers: [PropostasService, PropostaCalculatorService],
  exports: [PropostaCalculatorService],
})
export class PropostasModule {}
