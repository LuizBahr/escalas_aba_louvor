import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type Slot = { codigo: string; qtd: number };

// Slots padrão quando não há config salva
function getSlotsPadrao(): Slot[] {
  return [
    { codigo: 'BATERIA', qtd: 1 },
    { codigo: 'BAIXO', qtd: 1 },
    { codigo: 'GUITARRA', qtd: 1 },
    { codigo: 'VIOLAO', qtd: 1 },
    { codigo: 'TECLADO', qtd: 1 },
    { codigo: 'MINISTRO', qtd: 1 },
    { codigo: 'BACK_VOCAL', qtd: 3 },
    { codigo: 'TECNICO_SOM', qtd: 1 },
    { codigo: 'TECNICO_TRANSMISSAO', qtd: 1 },
  ];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mes = parseInt(searchParams.get('mes') || '0');
    const ano = parseInt(searchParams.get('ano') || '0');

    if (!mes || !ano) {
      return NextResponse.json({ error: 'Mês e ano são obrigatórios' }, { status: 400 });
    }

    const primeiroDia = new Date(ano, mes - 1, 1);
    const ultimoDia = new Date(ano, mes, 0, 23, 59, 59);

    const cultos = await prisma.culto.findMany({
      where: { data: { gte: primeiroDia, lte: ultimoDia } },
      orderBy: { data: 'asc' },
      include: { configEscala: true }
    });

    const instrumentos = await prisma.instrumentoConfig.findMany({
      where: { ativo: true },
      orderBy: { ordem: 'asc' }
    });

    const slotsPadrao = getSlotsPadrao();

    const cultosComConfig = cultos.map(culto => {
      const slotsRaw = culto.configEscala?.slots;
      let slots: Slot[] = slotsPadrao;
      if (slotsRaw && Array.isArray(slotsRaw) && slotsRaw.length > 0) {
        slots = (slotsRaw as Slot[]).filter(s => s.codigo && s.qtd >= 0);
      }
      return {
        id: culto.id,
        data: culto.data,
        especial: culto.especial,
        redeResponsavel: culto.redeResponsavel,
        descricao: culto.descricao,
        slots,
        nivelBanda: culto.configEscala?.nivelBanda || 'EQUILIBRADA'
      };
    });

    return NextResponse.json({
      cultos: cultosComConfig,
      instrumentosDisponiveis: instrumentos
    });
  } catch (error) {
    console.error('Erro ao buscar configs:', error);
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { configs } = body;

    if (!configs || !Array.isArray(configs)) {
      return NextResponse.json({ error: 'Configs inválidas' }, { status: 400 });
    }

    for (const cfg of configs) {
      const { cultoId, slots, nivelBanda } = cfg;
      if (!cultoId) continue;

      await prisma.configCultoEscala.upsert({
        where: { cultoId },
        update: { slots: slots || [], nivelBanda: nivelBanda || 'EQUILIBRADA' },
        create: { cultoId, slots: slots || [], nivelBanda: nivelBanda || 'EQUILIBRADA' }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar configs:', error);
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 });
  }
}
