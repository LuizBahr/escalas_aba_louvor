import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { nome, codigo, ativo, ordem } = body;

    const data: Record<string, unknown> = {};
    if (nome !== undefined) data.nome = String(nome).trim();
    if (codigo !== undefined) data.codigo = String(codigo).toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    if (ativo !== undefined) data.ativo = Boolean(ativo);
    if (ordem !== undefined) data.ordem = Number(ordem);

    if (data.codigo) {
      const existente = await prisma.instrumentoConfig.findFirst({
        where: { codigo: data.codigo as string, NOT: { id: params.id } }
      });
      if (existente) {
        return NextResponse.json({ error: 'Já existe outro instrumento com este código' }, { status: 400 });
      }
    }

    const instrumento = await prisma.instrumentoConfig.update({
      where: { id: params.id },
      data
    });

    return NextResponse.json(instrumento);
  } catch (error) {
    console.error('Erro ao atualizar instrumento:', error);
    return NextResponse.json({ error: 'Erro ao atualizar instrumento' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const instrumento = await prisma.instrumentoConfig.findUnique({ where: { id: params.id } });
    if (!instrumento) {
      return NextResponse.json({ error: 'Instrumento não encontrado' }, { status: 404 });
    }

    // Check if any volunteer uses this instrument
    const voluntariosUsando = await prisma.voluntario.findMany({
      where: { instrumentos: { has: instrumento.codigo } }
    });

    if (voluntariosUsando.length > 0) {
      return NextResponse.json({
        error: `Este instrumento está sendo usado por ${voluntariosUsando.length} voluntário(s). Remova-o dos voluntários antes de excluir.`
      }, { status: 400 });
    }

    await prisma.instrumentoConfig.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir instrumento:', error);
    return NextResponse.json({ error: 'Erro ao excluir instrumento' }, { status: 500 });
  }
}
