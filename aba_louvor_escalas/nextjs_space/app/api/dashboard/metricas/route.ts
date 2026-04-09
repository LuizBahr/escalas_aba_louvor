import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mes = parseInt(searchParams.get('mes') || '0');
    const ano = parseInt(searchParams.get('ano') || '0');

    // Dados base
    const voluntarios = await prisma.voluntario.findMany({ where: { ativo: true } });
    const totalAtivos = voluntarios.length;

    // Contagem por nível
    const porNivel = {
      EXPERIENTE: voluntarios.filter(v => v.nivel === 'EXPERIENTE').length,
      MEDIO: voluntarios.filter(v => v.nivel === 'MEDIO').length,
      NOVO: voluntarios.filter(v => v.nivel === 'NOVO').length,
    };

    // Contagem por rede
    const porRede = {
      BRANCA: voluntarios.filter(v => v.rede === 'BRANCA').length,
      AMARELA: voluntarios.filter(v => v.rede === 'AMARELA').length,
      LARANJA: voluntarios.filter(v => v.rede === 'LARANJA').length,
      ROXA: voluntarios.filter(v => v.rede === 'ROXA').length,
    };

    // Contagem de ministros e diretores
    const totalMinistros = voluntarios.filter(v => v.ministro).length;
    const totalDiretores = voluntarios.filter(v => v.diretorCulto).length;

    // Escalas do período (mês ou ano)
    let whereEscala: any = {};
    let periodoLabel = 'Geral';

    if (mes > 0 && ano > 0) {
      const primeiroDia = new Date(ano, mes - 1, 1);
      const ultimoDia = new Date(ano, mes, 0, 23, 59, 59);
      whereEscala = {
        culto: { data: { gte: primeiroDia, lte: ultimoDia } }
      };
      periodoLabel = `${mes}/${ano}`;
    } else if (ano > 0) {
      const primeiroDia = new Date(ano, 0, 1);
      const ultimoDia = new Date(ano, 11, 31, 23, 59, 59);
      whereEscala = {
        culto: { data: { gte: primeiroDia, lte: ultimoDia } }
      };
      periodoLabel = `${ano}`;
    }

    const escalasVoluntarios = await prisma.escalaVoluntario.findMany({
      where: whereEscala,
      include: {
        voluntario: { select: { id: true, nome: true, nivel: true, rede: true } },
        culto: { select: { data: true } }
      }
    });

    // Contagem de participações por voluntário
    const participacoes = new Map<string, { nome: string; count: number; nivel: string; rede: string }>();
    escalasVoluntarios.forEach(ev => {
      if (!ev.voluntario) return;
      const curr = participacoes.get(ev.voluntarioId) || {
        nome: ev.voluntario.nome,
        count: 0,
        nivel: ev.voluntario.nivel,
        rede: ev.voluntario.rede
      };
      curr.count++;
      participacoes.set(ev.voluntarioId, curr);
    });

    const ranking = Array.from(participacoes.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count);

    const maisServiram = ranking.slice(0, 10);
    const menosServiram = ranking.length > 0
      ? [...ranking].sort((a, b) => a.count - b.count).slice(0, 10)
      : [];

    // Voluntários ativos que NUNCA foram escalados no período
    const escaladosIds = new Set(participacoes.keys());
    const nuncaEscalados = voluntarios
      .filter(v => !escaladosIds.has(v.id))
      .map(v => ({ id: v.id, nome: v.nome, nivel: v.nivel, rede: v.rede }))
      .slice(0, 10);

    // Total de cultos no período
    let whereCulto: any = {};
    if (mes > 0 && ano > 0) {
      whereCulto = { data: { gte: new Date(ano, mes - 1, 1), lte: new Date(ano, mes, 0, 23, 59, 59) } };
    } else if (ano > 0) {
      whereCulto = { data: { gte: new Date(ano, 0, 1), lte: new Date(ano, 11, 31, 23, 59, 59) } };
    }
    const totalCultosPeriodo = await prisma.culto.count({ where: whereCulto });

    // Ausências ativas
    const ausenciasAtivas = await prisma.ausencia.count({
      where: {
        OR: [
          { dataFim: null },
          { dataFim: { gte: new Date() } }
        ]
      }
    });

    // Média de participações
    const mediaParticipacoes = ranking.length > 0
      ? (ranking.reduce((sum, r) => sum + r.count, 0) / ranking.length).toFixed(1)
      : '0';

    // Instrumentos mais escalados
    const instrumentoCount = new Map<string, number>();
    escalasVoluntarios.forEach(ev => {
      const parts = ev.funcao.split('_');
      const last = parts[parts.length - 1];
      if (/^\d+$/.test(last)) parts.pop();
      const codigo = parts.join('_');
      instrumentoCount.set(codigo, (instrumentoCount.get(codigo) || 0) + 1);
    });

    const instrumentoConfigs = await prisma.instrumentoConfig.findMany();
    const instrumentoNomes = new Map(instrumentoConfigs.map(i => [i.codigo, i.nome]));

    const instrumentosRanking = Array.from(instrumentoCount.entries())
      .map(([codigo, count]) => ({ codigo, nome: instrumentoNomes.get(codigo) || codigo, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      periodoLabel,
      totalAtivos,
      porNivel,
      porRede,
      totalMinistros,
      totalDiretores,
      totalCultosPeriodo,
      ausenciasAtivas,
      mediaParticipacoes,
      maisServiram,
      menosServiram,
      nuncaEscalados,
      instrumentosRanking,
    });
  } catch (error: any) {
    console.error('Error fetching metricas:', error);
    return NextResponse.json({ error: 'Erro ao buscar métricas' }, { status: 500 });
  }
}
