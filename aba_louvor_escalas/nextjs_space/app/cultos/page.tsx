import { Header } from '@/components/header';
import { CultosContent } from './_components/cultos-content';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function CultosPage() {
  const cultos = await prisma.culto.findMany({
    orderBy: { data: 'desc' }
  });

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <CultosContent cultos={cultos} />
    </div>
  );
}
