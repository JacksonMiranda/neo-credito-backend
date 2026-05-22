import { Test, TestingModule } from '@nestjs/testing';

describe('Modulo principal', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  it('carrega os modulos configurados da aplicacao', async () => {
    const { AppModule } = await import('./app.module');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(moduleFixture).toBeDefined();

    await moduleFixture.close();
  });
});
