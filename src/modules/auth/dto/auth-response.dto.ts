import { UserRole } from '@prisma/client';

class AuthUserDto {
  id: string;
  email: string;
  role: UserRole;
}

export class AuthResponseDto {
  accessToken: string;
  user: AuthUserDto;
}
