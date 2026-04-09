import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const {
      nome,
      dataNascimento,
      email,
      rede,
      qualGC,
      discipulador,
      instrumentos,
      ministro,
      diretorCulto,
      nivel,
      ativo
    } = body;
    const { id } = params;

    const existingVoluntario = await prisma.voluntario.findFirst({
      where: {
        email,
        NOT: { id }
      }
    });

    if (existingVoluntario) {
      return NextResponse.json(
        { error: 'Já existe outro voluntário com este email' },
        { status: 400 }
      );
    }

    const voluntario = await prisma.voluntario.update({
      where: { id },
      data: {
        nome,
        dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
        email,
        rede,
        qualGC: qualGC || null,
        discipulador: discipulador || null,
        instrumentos,
        ministro: ministro ?? false,
        diretorCulto: diretorCulto ?? false,
        nivel: nivel || 'MEDIO',
        ativo: ativo ?? true
      }
    });

    return NextResponse.json(voluntario);
  } catch (error: any) {
    console.error('Error updating voluntario:', error);
    return NextResponse.json({ error: 'Erro ao atualizar voluntário' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    await prisma.voluntario.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting voluntario:', error);
    return NextResponse.json({ error: 'Erro ao excluir voluntário' }, { status: 500 });
  }
}
