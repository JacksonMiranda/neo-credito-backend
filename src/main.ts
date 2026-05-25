import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) =>
        new BadRequestException({
          error: 'Dados invalidos',
          details: errors.map((err) => ({
            field: err.property,
            constraints: err.constraints,
          })),
        }),
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Neo Credito API')
    .setDescription(
      'API REST para autenticacao e gestao de propostas de credito.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs-json',
  });

  const port = configService.get<number>('PORT', 3000);

  await app.listen(port);
}

void bootstrap();
