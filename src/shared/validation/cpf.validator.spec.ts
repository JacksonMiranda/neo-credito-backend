import { isValidCpf } from './cpf.validator';

describe('isValidCpf', () => {
  it.each([
    '11144477735',
    '12345678909',
    '52998224725',
    '98765432100',
    '93541134780',
  ])('aceita CPF valido %s', (cpf) => {
    expect(isValidCpf(cpf)).toBe(true);
  });

  it.each(['12345678901', '00000000000', '11111111111', '123'])(
    'recusa CPF invalido %s',
    (cpf) => {
      expect(isValidCpf(cpf)).toBe(false);
    },
  );
});
