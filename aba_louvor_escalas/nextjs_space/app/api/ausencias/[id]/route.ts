import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { voluntarioId, dataInicio, dataFim, motivo } = body;
    const { id } = params;

    const ausencia = await prisma.ausencia.update({
      where: { id },
      data: {
        voluntarioId,
        dataInicio: new Date(dataInicio),
        dataFim: dataFim ? new Date(dataFim) : null,
        motivo: motivo || null
      },
      include: { voluntario: true }
    });

    return NextResponse.json(ausencia);
  } catch (error: any) {
    console.error('Error updating ausencia:', error);
    return NextResponse.json({ error: 'Erro ao atualizar ausência' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    await prisma.ausencia.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting ausencia:', error);
    return NextResponse.json({ error: 'Erro ao excluir ausência' }, { status: 500 });
  }
}
