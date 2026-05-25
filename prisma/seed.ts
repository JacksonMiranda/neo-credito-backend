import { PrismaClient, PropostaStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash('Teste@2024', 10);
  const seedCpfs = [
    '11144477735',
    '12345678909',
    '52998224725',
    '98765432100',
    '93541134780',
  ];
  const legacySeedCpfs = [
    '11111111111',
    '22222222222',
    '33333333333',
    '44444444444',
    '55555555555',
  ];

  const corban1 = await prisma.user.upsert({
    where: { email: 'corban1@neocredito.com.br' },
    update: { passwordHash, role: UserRole.CORBAN },
    create: {
      email: 'corban1@neocredito.com.br',
      passwordHash,
      role: UserRole.CORBAN,
    },
  });

  const corban2 = await prisma.user.upsert({
    where: { email: 'corban2@neocredito.com.br' },
    update: { passwordHash, role: UserRole.CORBAN },
    create: {
      email: 'corban2@neocredito.com.br',
      passwordHash,
      role: UserRole.CORBAN,
    },
  });

  await prisma.user.upsert({
    where: { email: 'operador@neocredito.com.br' },
    update: { passwordHash, role: UserRole.OPERADOR },
    create: {
      email: 'operador@neocredito.com.br',
      passwordHash,
      role: UserRole.OPERADOR,
    },
  });

  const propostasParaDeletar = await prisma.proposta.findMany({
    where: { clienteCpf: { in: [...seedCpfs, ...legacySeedCpfs] } },
    select: { id: true },
  });
  const idsParaDeletar = propostasParaDeletar.map((p) => p.id);

  await prisma.historicoStatusProposta.deleteMany({
    where: { propostaId: { in: idsParaDeletar } },
  });

  await prisma.proposta.deleteMany({
    where: {
      clienteCpf: {
        in: [...seedCpfs, ...legacySeedCpfs],
      },
    },
  });

  await prisma.proposta.createMany({
    data: [
      propostaSeed('Ana Souza', seedCpfs[0], 3200, 4500, 12, corban1.id),
      propostaSeed(
        'Bruno Lima',
        seedCpfs[1],
        5800,
        9000,
        18,
        corban1.id,
        PropostaStatus.EM_ANALISE,
      ),
      propostaSeed(
        'Carla Dias',
        seedCpfs[2],
        9200,
        18000,
        24,
        corban1.id,
        PropostaStatus.APROVADA,
      ),
      propostaSeed('Diego Rocha', seedCpfs[3], 4100, 7000, 6, corban2.id),
      propostaSeed(
        'Elisa Martins',
        seedCpfs[4],
        7600,
        22000,
        36,
        corban2.id,
        PropostaStatus.REPROVADA,
        'Score insuficiente para aprovacao',
      ),
    ],
  });
}

function propostaSeed(
  clienteNome: string,
  clienteCpf: string,
  clienteRenda: number,
  valorSolicitado: number,
  numeroParcelas: number,
  corbanId: string,
  status: PropostaStatus = PropostaStatus.RASCUNHO,
  motivoReprovacao?: string,
) {
  const taxaMensal = getMonthlyRate(valorSolicitado, numeroParcelas);
  const taxa = taxaMensal / 100;
  const factor = Math.pow(1 + taxa, numeroParcelas);
  const valorParcela = roundMoney(
    valorSolicitado * ((taxa * factor) / (factor - 1)),
  );

  return {
    clienteNome,
    clienteCpf,
    clienteRenda,
    valorSolicitado,
    numeroParcelas,
    taxaMensal,
    valorParcela,
    totalAPagar: roundMoney(valorParcela * numeroParcelas),
    status,
    motivoReprovacao:
      status === PropostaStatus.REPROVADA
        ? (motivoReprovacao ?? 'Motivo de reprovacao nao informado')
        : null,
    corbanId,
  };
}

function getMonthlyRate(
  valorSolicitado: number,
  numeroParcelas: number,
): number {
  const rates: Record<number, [number, number, number]> = {
    6: [1.99, 1.49, 1.09],
    12: [2.49, 1.89, 1.39],
    18: [2.99, 2.29, 1.79],
    24: [3.49, 2.79, 2.19],
    36: [3.99, 3.29, 2.79],
  };
  const bandIndex =
    valorSolicitado <= 5000 ? 0 : valorSolicitado <= 15000 ? 1 : 2;

  return rates[numeroParcelas][bandIndex];
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
