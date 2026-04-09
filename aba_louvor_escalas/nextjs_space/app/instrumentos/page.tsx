export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { Header } from '@/components/header';
import { InstrumentosContent } from './_components/instrumentos-content';

export default async function InstrumentosPage() {
  const instrumentos = await prisma.instrumentoConfig.findMany({
    orderBy: { ordem: 'asc' }
  });

  // Count volunteers per instrument
  const allVoluntarios = await prisma.voluntario.findMany({
    where: { ativo: true },
    select: { instrumentos: true }
  });

  const contagem: Record<string, number> = {};
  allVoluntarios.forEach(v => {
    v.instrumentos.forEach(inst => {
      contagem[inst] = (contagem[inst] || 0) + 1;
    });
  });

  const instrumentosComContagem = instrumentos.map(i => ({
    ...i,
    totalVoluntarios: contagem[i.codigo] || 0
  }));

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <InstrumentosContent instrumentos={instrumentosComContagem} />
    </div>
  );
}
