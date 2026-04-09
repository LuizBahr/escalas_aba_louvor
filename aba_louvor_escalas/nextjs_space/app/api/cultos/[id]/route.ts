import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { data, especial, redeResponsavel, descricao } = body;
    const { id } = params;

    const culto = await prisma.culto.update({
      where: { id },
      data: {
        data: new Date(data),
        especial: especial ?? false,
        redeResponsavel,
        descricao: descricao || null
      }
    });

    return NextResponse.json(culto);
  } catch (error: any) {
    console.error('Error updating culto:', error);
    return NextResponse.json({ error: 'Erro ao atualizar culto' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    await prisma.culto.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting culto:', error);
    return NextResponse.json({ error: 'Erro ao excluir culto' }, { status: 500 });
  }
}
