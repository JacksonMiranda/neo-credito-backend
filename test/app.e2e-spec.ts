import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

jest.mock('@prisma/client', () => ({
  PrismaClient: class {
    $connect = jest.fn();
    $disconnect = jest.fn();
  },
}));

describe('Modulo principal', () => {
  it('carrega a aplicacao inicial', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(moduleFixture).toBeDefined();

    await moduleFixture.close();
  });
});
