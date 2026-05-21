import { Module } from '@nestjs/common';
import { PropostaCalculatorService } from './services/proposta-calculator.service';

@Module({
  providers: [PropostaCalculatorService],
  exports: [PropostaCalculatorService],
})
export class PropostasModule {}
