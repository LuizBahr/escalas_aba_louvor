import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const voluntarios = await prisma.voluntario.findMany({
      orderBy: { nome: 'asc' }
    });

    return NextResponse.json(voluntarios);
  } catch (error: any) {
    console.error('Error fetching voluntarios:', error);
    return NextResponse.json({ error: 'Erro ao buscar voluntários' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    if (!nome || !email || !rede || !instrumentos || instrumentos.length === 0) {
      return NextResponse.json(
        { error: 'Nome, email, rede e instrumentos são obrigatórios' },
        { status: 400 }
      );
    }

    const existingVoluntario = await prisma.voluntario.findUnique({
      where: { email }
    });

    if (existingVoluntario) {
      return NextResponse.json(
        { error: 'Já existe um voluntário com este email' },
        { status: 400 }
      );
    }

    const voluntario = await prisma.voluntario.create({
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

    return NextResponse.json(voluntario, { status: 201 });
  } catch (error: any) {
    console.error('Error creating voluntario:', error);
    return NextResponse.json({ error: 'Erro ao criar voluntário' }, { status: 500 });
  }
}
