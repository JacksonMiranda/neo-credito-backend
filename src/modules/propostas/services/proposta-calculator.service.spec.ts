import { BadRequestException } from '@nestjs/common';
import { PropostaCalculatorService } from './proposta-calculator.service';

describe('PropostaCalculatorService', () => {
  const service = new PropostaCalculatorService();

  it.each([
    [500, 6, 1.99],
    [5000, 12, 2.49],
    [5001, 12, 1.89],
    [15000, 24, 2.79],
    [15001, 24, 2.19],
    [50000, 36, 2.79],
  ])(
    'retorna taxa mensal para valor %s em %s parcelas',
    (valorSolicitado, numeroParcelas, taxaEsperada) => {
      expect(service.getMonthlyRate(valorSolicitado, numeroParcelas)).toBe(
        taxaEsperada,
      );
    },
  );

  it('calcula parcela e total a pagar com juros compostos', () => {
    expect(service.calculate(10000, 12)).toEqual({
      taxaMensal: 1.89,
      valorParcela: 939.22,
      totalAPagar: 11270.64,
    });
  });

  it.each([
    [499, 12],
    [50001, 12],
  ])(
    'recusa valor solicitado fora dos limites',
    (valorSolicitado, parcelas) => {
      expect(() => service.calculate(valorSolicitado, parcelas)).toThrow(
        BadRequestException,
      );
    },
  );

  it('recusa quantidade de parcelas nao permitida', () => {
    expect(() => service.calculate(10000, 10)).toThrow(BadRequestException);
  });
});
