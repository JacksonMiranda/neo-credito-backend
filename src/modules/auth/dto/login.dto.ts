import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email do usuario cadastrado.',
    example: 'corban1@neocredito.com.br',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Senha do usuario.',
    minLength: 8,
    example: 'Teste@2024',
  })
  @IsString()
  @MinLength(8)
  senha: string;
}
