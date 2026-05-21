import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsCpf(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (target: object, propertyName: string | symbol): void => {
    registerDecorator({
      name: 'isCpf',
      target: target.constructor,
      propertyName: String(propertyName),
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return isValidCpf(value);
        },
        defaultMessage(): string {
          return 'clienteCpf deve ser um CPF valido';
        },
      },
    });
  };
}

export function isValidCpf(value: unknown): boolean {
  const cpf = String(value ?? '').replace(/\D/g, '');

  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  const firstCheckDigit = calculateCheckDigit(cpf, 9);
  const secondCheckDigit = calculateCheckDigit(cpf, 10);

  return (
    firstCheckDigit === Number(cpf[9]) && secondCheckDigit === Number(cpf[10])
  );
}

function calculateCheckDigit(cpf: string, length: number): number {
  let sum = 0;

  for (let index = 0; index < length; index += 1) {
    sum += Number(cpf[index]) * (length + 1 - index);
  }

  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}
