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

    const errors: string[] = [];
    let successCount = 0;

    for (const row of data as any[]) {
      try {
        const dataStr = row?.data || row?.Data || row?.DATA;
        const especialStr = row?.especial || row?.Especial || row?.ESPECIAL;
        const redeStr = row?.rede || row?.Rede || row?.REDE;
        const descricaoStr = row?.descricao || row?.Descricao || row?.DESCRICAO;

        if (!dataStr || !redeStr) {
          errors.push(`Linha ignorada: falta data ou rede`);
          continue;
        }

        let dataCulto: Date;
        if (typeof dataStr === 'number') {
          dataCulto = new Date((dataStr - 25569) * 86400 * 1000);
        } else {
          const parts = dataStr.split('/');
          if (parts.length === 3) {
            dataCulto = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          } else {
            dataCulto = new Date(dataStr);
          }
        }

        if (isNaN(dataCulto.getTime())) {
          errors.push(`Data inválida: ${dataStr}`);
          continue;
        }

        const especial = String(especialStr ?? '').toLowerCase() === 'sim';
        const redeUpper = String(redeStr ?? '').toUpperCase();

        if (!['BRANCA', 'AMARELA', 'LARANJA', 'ROXA'].includes(redeUpper)) {
          errors.push(`Rede inválida: ${redeStr}`);
          continue;
        }

        await prisma.culto.create({
          data: {
            data: dataCulto,
            especial,
            redeResponsavel: redeUpper as any,
            descricao: descricaoStr ? String(descricaoStr) : null
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
    console.error('Error importing cultos:', error);
    return NextResponse.json(
      { error: 'Erro ao importar arquivo' },
      { status: 500 }
    );
  }
}
