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
        const emailStr = row?.email || row?.Email || row?.EMAIL;
        const dataInicioStr = row?.dataInicio || row?.DataInicio || row?.DATA_INICIO;
        const dataFimStr = row?.dataFim || row?.DataFim || row?.DATA_FIM;
        const motivoStr = row?.motivo || row?.Motivo || row?.MOTIVO;

        if (!emailStr || !dataInicioStr) {
          errors.push(`Linha ignorada: falta email ou data de início`);
          continue;
        }

        const voluntario = await prisma.voluntario.findUnique({
          where: { email: String(emailStr) }
        });

        if (!voluntario) {
          errors.push(`Voluntário não encontrado: ${emailStr}`);
          continue;
        }

        let dataInicio: Date;
        if (typeof dataInicioStr === 'number') {
          dataInicio = new Date((dataInicioStr - 25569) * 86400 * 1000);
        } else {
          const parts = String(dataInicioStr).split('/');
          if (parts.length === 3) {
            dataInicio = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          } else {
            dataInicio = new Date(dataInicioStr);
          }
        }

        if (isNaN(dataInicio.getTime())) {
          errors.push(`Data de início inválida: ${dataInicioStr}`);
          continue;
        }

        let dataFim: Date | null = null;
        if (dataFimStr) {
          if (typeof dataFimStr === 'number') {
            dataFim = new Date((dataFimStr - 25569) * 86400 * 1000);
          } else {
            const parts = String(dataFimStr).split('/');
            if (parts.length === 3) {
              dataFim = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            } else {
              dataFim = new Date(dataFimStr);
            }
          }
          if (isNaN(dataFim.getTime())) {
            dataFim = null;
          }
        }

        await prisma.ausencia.create({
          data: {
            voluntarioId: voluntario.id,
            dataInicio,
            dataFim,
            motivo: motivoStr ? String(motivoStr) : null
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
    console.error('Error importing ausencias:', error);
    return NextResponse.json(
      { error: 'Erro ao importar arquivo' },
      { status: 500 }
    );
  }
}
