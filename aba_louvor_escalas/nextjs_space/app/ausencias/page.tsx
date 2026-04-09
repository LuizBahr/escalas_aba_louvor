import { Header } from '@/components/header';
import { AusenciasContent } from './_components/ausencias-content';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AusenciasPage() {
  const [ausencias, voluntarios] = await Promise.all([
    prisma.ausencia.findMany({
      include: { voluntario: true },
      orderBy: { dataInicio: 'desc' }
    }),
    prisma.voluntario.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' }
    })
  ]);

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <AusenciasContent ausencias={ausencias} voluntarios={voluntarios} />
    </div>
  );
}
