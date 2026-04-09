import { Header } from '@/components/header';
import { VoluntariosContent } from './_components/voluntarios-content';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function VoluntariosPage() {
  const voluntarios = await prisma.voluntario.findMany({
    orderBy: { nome: 'asc' }
  });

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <VoluntariosContent voluntarios={voluntarios} />
    </div>
  );
}
