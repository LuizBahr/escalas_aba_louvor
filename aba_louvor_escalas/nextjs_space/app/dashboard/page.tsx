import { Header } from '@/components/header';
import { DashboardContent } from './_components/dashboard-content';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [totalVoluntarios, totalCultos, totalAusencias, proximosCultos] = await Promise.all([
    prisma.voluntario.count({ where: { ativo: true } }),
    prisma.culto.count(),
    prisma.ausencia.count(),
    prisma.culto.findMany({
      where: { data: { gte: new Date() } },
      orderBy: { data: 'asc' },
      take: 5
    })
  ]);

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <DashboardContent
        stats={{
          totalVoluntarios,
          totalCultos,
          totalAusencias,
          proximosCultos
        }}
      />
    </div>
  );
}
