import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ERROR_RESPONSE_EXAMPLES } from '../../shared/dto/error-response.dto';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginRateLimitGuard } from './guards/login-rate-limit.guard';
import { AuthenticatedUser } from './types/authenticated-user.type';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LoginRateLimitGuard)
  @ApiOperation({
    summary: 'Autenticar usuario',
    description: 'Recebe email e senha e retorna um token JWT Bearer.',
  })
  @ApiOkResponse({
    description: 'Autenticacao realizada com sucesso.',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Campos invalidos ou ausentes.',
    schema: { example: ERROR_RESPONSE_EXAMPLES.validation },
  })
  @ApiUnauthorizedResponse({
    description: 'Credenciais invalidas.',
    schema: {
      example: {
        error: 'Credenciais invalidas',
        details: {},
      },
    },
  })
  @ApiTooManyRequestsResponse({
    description: 'Muitas tentativas de login.',
    schema: {
      example: {
        error: 'Muitas tentativas de login. Tente novamente mais tarde.',
        details: {
          limit: 10,
          windowMs: 60000,
          retryAfterSeconds: 42,
        },
      },
    },
  })
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto.email, dto.senha);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Retornar usuario autenticado',
    description: 'Valida o JWT Bearer e retorna os dados do usuario.',
  })
  @ApiOkResponse({
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'corban1@neocredito.com.br',
        role: 'CORBAN',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, invalido ou expirado.',
    schema: { example: ERROR_RESPONSE_EXAMPLES.unauthorized },
  })
  me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }
}
