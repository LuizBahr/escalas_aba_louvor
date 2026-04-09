import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const ausencias = await prisma.ausencia.findMany({
      include: { voluntario: true },
      orderBy: { dataInicio: 'desc' }
    });

    return NextResponse.json(ausencias);
  } catch (error: any) {
    console.error('Error fetching ausencias:', error);
    return NextResponse.json({ error: 'Erro ao buscar ausências' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { voluntarioId, dataInicio, dataFim, motivo } = body;

    if (!voluntarioId || !dataInicio) {
      return NextResponse.json(
        { error: 'Voluntário e data de início são obrigatórios' },
        { status: 400 }
      );
    }

    const ausencia = await prisma.ausencia.create({
      data: {
        voluntarioId,
        dataInicio: new Date(dataInicio),
        dataFim: dataFim ? new Date(dataFim) : null,
        motivo: motivo || null
      },
      include: { voluntario: true }
    });

    return NextResponse.json(ausencia, { status: 201 });
  } catch (error: any) {
    console.error('Error creating ausencia:', error);
    return NextResponse.json({ error: 'Erro ao criar ausência' }, { status: 500 });
  }
}
