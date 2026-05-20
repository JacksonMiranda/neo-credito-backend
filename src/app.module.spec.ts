import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';

describe('Modulo principal', () => {
  it('carrega os modulos configurados da aplicacao', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(moduleFixture).toBeDefined();

    await moduleFixture.close();
  });
});
