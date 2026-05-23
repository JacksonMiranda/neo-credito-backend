import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

class AuthUserDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'corban1@neocredito.com.br' })
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.CORBAN })
  role: UserRole;
}

export class AuthResponseDto {
  @ApiProperty({ example: 'jwt.token.assinado' })
  accessToken: string;

  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;
}
