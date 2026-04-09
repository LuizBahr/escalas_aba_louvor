import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { escalaId, cultoId, funcao, voluntarioId } = body;

    if (!escalaId || !cultoId || !funcao || !voluntarioId) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // Buscar se já existe um registro para essa funcao nesse culto/escala
    const existente = await prisma.escalaVoluntario.findFirst({
      where: { escalaId, cultoId, funcao }
    });

    if (existente) {
      await prisma.escalaVoluntario.update({
        where: { id: existente.id },
        data: { voluntarioId, manual: true }
      });
    } else {
      await prisma.escalaVoluntario.create({
        data: { escalaId, cultoId, voluntarioId, funcao, manual: true }
      });
    }

    const escala = await prisma.escala.findUnique({
      where: { id: escalaId },
      include: {
        voluntarios: {
          include: { voluntario: true, culto: true }
        }
      }
    });

    if (!escala) {
      return NextResponse.json({ error: 'Escala não encontrada' }, { status: 404 });
    }

    const cultos = await prisma.culto.findMany({
      where: {
        data: {
          gte: new Date(escala.ano, escala.mes - 1, 1),
          lte: new Date(escala.ano, escala.mes, 0, 23, 59, 59)
        }
      },
      orderBy: { data: 'asc' },
      include: { configEscala: true }
    });

    const voluntarios = await prisma.voluntario.findMany({ where: { ativo: true } });
    const instrumentoConfigs = await prisma.instrumentoConfig.findMany({ orderBy: { ordem: 'asc' } });

    const slotsPadrao = [
      { codigo: 'BATERIA', qtd: 1 }, { codigo: 'BAIXO', qtd: 1 },
      { codigo: 'GUITARRA', qtd: 1 }, { codigo: 'VIOLAO', qtd: 1 },
      { codigo: 'TECLADO', qtd: 1 }, { codigo: 'MINISTRO', qtd: 1 },
      { codigo: 'BACK_VOCAL', qtd: 3 }, { codigo: 'TECNICO_SOM', qtd: 1 },
      { codigo: 'TECNICO_TRANSMISSAO', qtd: 1 },
    ];

    const cultosComVoluntarios = cultos.map((culto) => {
      const voluntariosDoCulto = escala?.voluntarios?.filter((ev) => ev.cultoId === culto.id) ?? [];
      const slotsRaw = culto.configEscala?.slots;
      let slots = slotsPadrao;
      if (slotsRaw && Array.isArray(slotsRaw) && (slotsRaw as any[]).length > 0) {
        slots = (slotsRaw as any[]).filter((s: any) => s.codigo && s.qtd > 0);
      }
      return { ...culto, voluntarios: voluntariosDoCulto, slots };
    });

    return NextResponse.json({
      id: escala.id,
      mes: escala.mes,
      ano: escala.ano,
      cultos: cultosComVoluntarios,
      voluntariosDisponiveis: voluntarios,
      instrumentoConfigs: instrumentoConfigs.map(i => ({ codigo: i.codigo, nome: i.nome }))
    });
  } catch (error: any) {
    console.error('Error editing escala:', error);
    return NextResponse.json({ error: 'Erro ao editar escala' }, { status: 500 });
  }
}
