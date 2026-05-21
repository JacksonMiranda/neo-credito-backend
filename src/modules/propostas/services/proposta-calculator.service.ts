import { BadRequestException, Injectable } from '@nestjs/common';

export type PropostaCalculation = {
  taxaMensal: number;
  valorParcela: number;
  totalAPagar: number;
};

const VALOR_MINIMO = 500;
const VALOR_MAXIMO = 50000;
const PARCELAS_PERMITIDAS = [6, 12, 18, 24, 36] as const;
type ParcelasPermitidas = (typeof PARCELAS_PERMITIDAS)[number];

const TABELA_TAXAS: Record<ParcelasPermitidas, [number, number, number]> = {
  6: [1.99, 1.49, 1.09],
  12: [2.49, 1.89, 1.39],
  18: [2.99, 2.29, 1.79],
  24: [3.49, 2.79, 2.19],
  36: [3.99, 3.29, 2.79],
};

@Injectable()
export class PropostaCalculatorService {
  calculate(
    valorSolicitado: number,
    numeroParcelas: number,
  ): PropostaCalculation {
    const taxaMensal = this.getMonthlyRate(valorSolicitado, numeroParcelas);
    const taxaDecimal = taxaMensal / 100;
    const fator = Math.pow(1 + taxaDecimal, numeroParcelas);
    const valorParcela =
      valorSolicitado * ((taxaDecimal * fator) / (fator - 1));
    const parcelaArredondada = this.roundMoney(valorParcela);

    return {
      taxaMensal,
      valorParcela: parcelaArredondada,
      totalAPagar: this.roundMoney(parcelaArredondada * numeroParcelas),
    };
  }

  getMonthlyRate(valorSolicitado: number, numeroParcelas: number): number {
    this.validateAmount(valorSolicitado);

    if (!this.isAllowedInstallment(numeroParcelas)) {
      throw new BadRequestException({
        error: 'Numero de parcelas invalido',
        details: { allowed: PARCELAS_PERMITIDAS },
      });
    }

    return TABELA_TAXAS[numeroParcelas][this.getAmountBand(valorSolicitado)];
  }

  private validateAmount(valorSolicitado: number): void {
    if (valorSolicitado < VALOR_MINIMO || valorSolicitado > VALOR_MAXIMO) {
      throw new BadRequestException({
        error: 'Valor solicitado fora do limite permitido',
        details: {
          min: VALOR_MINIMO,
          max: VALOR_MAXIMO,
        },
      });
    }
  }

  private getAmountBand(valorSolicitado: number): 0 | 1 | 2 {
    if (valorSolicitado <= 5000) {
      return 0;
    }

    if (valorSolicitado <= 15000) {
      return 1;
    }

    return 2;
  }

  private isAllowedInstallment(
    numeroParcelas: number,
  ): numeroParcelas is ParcelasPermitidas {
    return PARCELAS_PERMITIDAS.includes(numeroParcelas as ParcelasPermitidas);
  }

  private roundMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
