import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const cultos = await prisma.culto.findMany({
      orderBy: { data: 'desc' }
    });

    return NextResponse.json(cultos);
  } catch (error: any) {
    console.error('Error fetching cultos:', error);
    return NextResponse.json({ error: 'Erro ao buscar cultos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, especial, redeResponsavel, descricao } = body;

    if (!data || !redeResponsavel) {
      return NextResponse.json(
        { error: 'Data e rede responsável são obrigatórios' },
        { status: 400 }
      );
    }

    const culto = await prisma.culto.create({
      data: {
        data: new Date(data),
        especial: especial ?? false,
        redeResponsavel,
        descricao: descricao || null
      }
    });

    return NextResponse.json(culto, { status: 201 });
  } catch (error: any) {
    console.error('Error creating culto:', error);
    return NextResponse.json({ error: 'Erro ao criar culto' }, { status: 500 });
  }
}
