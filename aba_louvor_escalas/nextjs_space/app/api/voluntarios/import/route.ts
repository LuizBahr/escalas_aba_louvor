import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Fetch valid instruments from DB
    const instrumentosDB = await prisma.instrumentoConfig.findMany({ where: { ativo: true }, select: { codigo: true } });
    const validInstrumentosCodigos = instrumentosDB.map(i => i.codigo);

    const errors: string[] = [];
    let successCount = 0;

    for (const row of data as any[]) {
      try {
        const nome = row?.nome || row?.Nome || row?.NOME;
        const email = row?.email || row?.Email || row?.EMAIL;
        const dataNascStr = row?.dataNascimento || row?.DataNascimento || row?.DATA_NASCIMENTO;
        const rede = row?.rede || row?.Rede || row?.REDE;
        const qualGC = row?.qualGC || row?.QualGC || row?.QUAL_GC;
        const discipulador = row?.discipulador || row?.Discipulador || row?.DISCIPULADOR;
        const instrumentosStr = row?.instrumentos || row?.Instrumentos || row?.INSTRUMENTOS;
        const ministroStr = row?.ministro || row?.Ministro || row?.MINISTRO;
        const diretorStr = row?.diretorCulto || row?.DiretorCulto || row?.DIRETOR_CULTO;
        const nivel = row?.nivel || row?.Nivel || row?.NIVEL;

        if (!nome || !email || !rede) {
          errors.push(`Linha ignorada: falta nome, email ou rede`);
          continue;
        }

        const existing = await prisma.voluntario.findUnique({
          where: { email: String(email) }
        });

        if (existing) {
          errors.push(`Email já existe: ${email}`);
          continue;
        }

        let dataNascimento: Date | null = null;
        if (dataNascStr) {
          if (typeof dataNascStr === 'number') {
            dataNascimento = new Date((dataNascStr - 25569) * 86400 * 1000);
          } else {
            const parts = String(dataNascStr).split('/');
            if (parts.length === 3) {
              dataNascimento = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            } else {
              dataNascimento = new Date(dataNascStr);
            }
          }
          if (isNaN(dataNascimento.getTime())) {
            dataNascimento = null;
          }
        }

        const instrumentos: string[] = [];
        if (instrumentosStr) {
          const instrumentosList = String(instrumentosStr).split(',').map((i) => i.trim().toUpperCase());
          instrumentosList.forEach((inst) => {
            if (validInstrumentosCodigos.includes(inst)) {
              instrumentos.push(inst);
            }
          });
        }

        if (instrumentos.length === 0) {
          errors.push(`Linha ignorada: sem instrumentos válidos - ${nome}`);
          continue;
        }

        const redeUpper = String(rede).toUpperCase();
        if (!['BRANCA', 'AMARELA', 'LARANJA', 'ROXA'].includes(redeUpper)) {
          errors.push(`Rede inválida: ${rede} - ${nome}`);
          continue;
        }

        const nivelUpper = String(nivel ?? 'MEDIO').toUpperCase();
        const nivelFinal = ['NOVO', 'MEDIO', 'EXPERIENTE'].includes(nivelUpper) ? nivelUpper : 'MEDIO';

        const ministro = String(ministroStr ?? '').toLowerCase() === 'sim';
        const diretorCulto = String(diretorStr ?? '').toLowerCase() === 'sim';

        await prisma.voluntario.create({
          data: {
            nome: String(nome),
            email: String(email),
            dataNascimento,
            rede: redeUpper as any,
            qualGC: qualGC ? String(qualGC) : null,
            discipulador: discipulador ? String(discipulador) : null,
            instrumentos: instrumentos as any,
            ministro,
            diretorCulto,
            nivel: nivelFinal as any,
            ativo: true
          }
        });

        successCount++;
      } catch (err: any) {
        errors.push(`Erro ao processar linha: ${err?.message ?? 'erro desconhecido'}`);
      }
    }

    return NextResponse.json({
      success: successCount,
      errors
    });
  } catch (error: any) {
    console.error('Error importing voluntarios:', error);
    return NextResponse.json(
      { error: 'Erro ao importar arquivo' },
      { status: 500 }
    );
  }
}
