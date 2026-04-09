import { Header } from '@/components/header';
import { EscalasContent } from './_components/escalas-content';

export const dynamic = 'force-dynamic';

export default async function EscalasPage() {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <EscalasContent />
    </div>
  );
}
