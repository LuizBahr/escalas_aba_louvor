import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const instrumentos = await prisma.instrumentoConfig.findMany({
      orderBy: { ordem: 'asc' }
    });
    return NextResponse.json(instrumentos);
  } catch (error) {
    console.error('Erro ao buscar instrumentos:', error);
    return NextResponse.json({ error: 'Erro ao buscar instrumentos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome, codigo } = body;

    if (!nome || !codigo) {
      return NextResponse.json({ error: 'Nome e código são obrigatórios' }, { status: 400 });
    }

    const codigoFormatado = String(codigo).toUpperCase().replace(/[^A-Z0-9_]/g, '_');

    const existente = await prisma.instrumentoConfig.findUnique({ where: { codigo: codigoFormatado } });
    if (existente) {
      return NextResponse.json({ error: 'Já existe um instrumento com este código' }, { status: 400 });
    }

    const maxOrdem = await prisma.instrumentoConfig.aggregate({ _max: { ordem: true } });
    const novaOrdem = (maxOrdem._max.ordem ?? 0) + 1;

    const instrumento = await prisma.instrumentoConfig.create({
      data: {
        nome: String(nome).trim(),
        codigo: codigoFormatado,
        ordem: novaOrdem
      }
    });

    return NextResponse.json(instrumento, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar instrumento:', error);
    return NextResponse.json({ error: 'Erro ao criar instrumento' }, { status: 500 });
  }
}
