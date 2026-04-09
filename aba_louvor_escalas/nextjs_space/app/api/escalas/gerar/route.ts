import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type Voluntario = {
  id: string;
  nome: string;
  rede: string;
  instrumentos: string[];
  ministro: boolean;
  diretorCulto: boolean;
  nivel: string;
};

type Ausencia = {
  voluntarioId: string;
  dataInicio: Date;
  dataFim: Date | null;
};

type Slot = { codigo: string; qtd: number };

const MAX_ESCALAS_MES = 3;

function isVoluntarioDisponivel(voluntarioId: string, data: Date, ausencias: Ausencia[]): boolean {
  return !ausencias.some((ausencia) => {
    const inicio = new Date(ausencia.dataInicio);
    const fim = ausencia.dataFim ? new Date(ausencia.dataFim) : new Date('2099-12-31');
    return ausencia.voluntarioId === voluntarioId && data >= inicio && data <= fim;
  });
}

function voluntarioFoiEscaladoRecentemente(
  voluntarioId: string,
  dataCulto: Date,
  cultosAnteriores: any[],
  diasMinimos: number = 7
): boolean {
  const dataLimite = new Date(dataCulto);
  dataLimite.setDate(dataLimite.getDate() - diasMinimos);
  return cultosAnteriores.some((culto) => {
    const dataCultoAnterior = new Date(culto.data);
    if (dataCultoAnterior >= dataLimite && dataCultoAnterior < dataCulto) {
      return culto.voluntarios?.some((v: any) => v.voluntarioId === voluntarioId);
    }
    return false;
  });
}

// Retorna a funcao (CODIGO) usada pelo voluntário no culto anterior mais recente
function getFuncaoAnterior(
  voluntarioId: string,
  cultosAnteriores: any[]
): string | null {
  for (let i = cultosAnteriores.length - 1; i >= 0; i--) {
    const v = cultosAnteriores[i].voluntarios?.find((ev: any) => ev.voluntarioId === voluntarioId);
    if (v) return v.funcao;
  }
  return null;
}

// Extrai o codigo do instrumento de uma funcao (BATERIA_1 -> BATERIA)
function extractCodigo(funcao: string): string {
  const parts = funcao.split('_');
  const last = parts[parts.length - 1];
  if (/^\d+$/.test(last)) parts.pop();
  return parts.join('_');
}

function selecionarVoluntario(
  funcao: string,
  codigoInstrumento: string,
  voluntarios: Voluntario[],
  redeResponsavel: string,
  dataCulto: Date,
  ausencias: Ausencia[],
  cultosProcessados: any[],
  jaEscalados: Set<string>,
  contagemMensal: Map<string, number>,
  nivelBanda: string // EXPERIENTE, INTERMEDIARIA, EQUILIBRADA
): Voluntario | null {
  const isMinistro = codigoInstrumento === 'MINISTRO';

  // Filtragem com todas as regras
  let candidatos = voluntarios.filter((v) => {
    if (jaEscalados.has(v.id)) return false;
    if (!isVoluntarioDisponivel(v.id, dataCulto, ausencias)) return false;
    if ((contagemMensal.get(v.id) || 0) >= MAX_ESCALAS_MES) return false;
    if (voluntarioFoiEscaladoRecentemente(v.id, dataCulto, cultosProcessados, 7)) return false;
    if (isMinistro) return v.ministro;
    return v.instrumentos?.includes(codigoInstrumento);
  });

  // Relaxar: permitir acima de MAX_ESCALAS_MES
  if (candidatos.length === 0) {
    candidatos = voluntarios.filter((v) => {
      if (jaEscalados.has(v.id)) return false;
      if (!isVoluntarioDisponivel(v.id, dataCulto, ausencias)) return false;
      if (voluntarioFoiEscaladoRecentemente(v.id, dataCulto, cultosProcessados, 7)) return false;
      if (isMinistro) return v.ministro;
      return v.instrumentos?.includes(codigoInstrumento);
    });
  }

  // Relaxar: permitir dias consecutivos
  if (candidatos.length === 0) {
    candidatos = voluntarios.filter((v) => {
      if (jaEscalados.has(v.id)) return false;
      if (!isVoluntarioDisponivel(v.id, dataCulto, ausencias)) return false;
      if (isMinistro) return v.ministro;
      return v.instrumentos?.includes(codigoInstrumento);
    });
  }

  if (candidatos.length === 0) return null;

  // Priorizar voluntários de outra rede
  const candidatosOutraRede = candidatos.filter((v) => v.rede !== redeResponsavel);
  let pool = candidatosOutraRede.length > 0 ? candidatosOutraRede : candidatos;

  // Variação de funções: priorizar quem NÃO fez o mesmo instrumento no culto anterior
  if (!isMinistro && pool.length > 1) {
    const codigoAtual = extractCodigo(funcao);
    const poolVariado = pool.filter((v) => {
      const funcaoAnterior = getFuncaoAnterior(v.id, cultosProcessados);
      if (!funcaoAnterior) return true;
      return extractCodigo(funcaoAnterior) !== codigoAtual;
    });
    if (poolVariado.length > 0) pool = poolVariado;
  }

  // Filtrar por nível da banda
  if (nivelBanda === 'EXPERIENTE') {
    const exp = pool.filter((v) => v.nivel === 'EXPERIENTE');
    if (exp.length > 0) return exp[Math.floor(Math.random() * exp.length)];
    const med = pool.filter((v) => v.nivel === 'MEDIO');
    if (med.length > 0) return med[Math.floor(Math.random() * med.length)];
  } else if (nivelBanda === 'INTERMEDIARIA') {
    const expMed = pool.filter((v) => v.nivel === 'EXPERIENTE' || v.nivel === 'MEDIO');
    if (expMed.length > 0) return expMed[Math.floor(Math.random() * expMed.length)];
  } else {
    // EQUILIBRADA (padrão): priorizar experientes > médios > novos
    const experientes = pool.filter((v) => v.nivel === 'EXPERIENTE');
    const medios = pool.filter((v) => v.nivel === 'MEDIO');
    const novos = pool.filter((v) => v.nivel === 'NOVO');
    if (experientes.length > 0) return experientes[Math.floor(Math.random() * experientes.length)];
    if (medios.length > 0) return medios[Math.floor(Math.random() * medios.length)];
    if (novos.length > 0) return novos[Math.floor(Math.random() * novos.length)];
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

// Slots padrão
function getSlotsPadrao(): Slot[] {
  return [
    { codigo: 'BATERIA', qtd: 1 },
    { codigo: 'BAIXO', qtd: 1 },
    { codigo: 'GUITARRA', qtd: 1 },
    { codigo: 'VIOLAO', qtd: 1 },
    { codigo: 'TECLADO', qtd: 1 },
    { codigo: 'MINISTRO', qtd: 1 },
    { codigo: 'BACK_VOCAL', qtd: 3 },
    { codigo: 'TECNICO_SOM', qtd: 1 },
    { codigo: 'TECNICO_TRANSMISSAO', qtd: 1 },
  ];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mes, ano } = body;

    if (!mes || !ano) {
      return NextResponse.json({ error: 'Mês e ano são obrigatórios' }, { status: 400 });
    }

    const primeiroDia = new Date(ano, mes - 1, 1);
    const ultimoDia = new Date(ano, mes, 0, 23, 59, 59);

    const cultos = await prisma.culto.findMany({
      where: { data: { gte: primeiroDia, lte: ultimoDia } },
      orderBy: { data: 'asc' },
      include: { configEscala: true }
    });

    if (cultos.length === 0) {
      return NextResponse.json({ error: 'Nenhum culto cadastrado para este mês' }, { status: 400 });
    }

    const voluntarios = await prisma.voluntario.findMany({ where: { ativo: true } });
    if (voluntarios.length === 0) {
      return NextResponse.json({ error: 'Nenhum voluntário ativo cadastrado' }, { status: 400 });
    }

    const ausencias = await prisma.ausencia.findMany();

    const escalaExistente = await prisma.escala.findUnique({
      where: { mes_ano: { mes, ano } }
    });

    let escala;
    if (escalaExistente) {
      await prisma.escalaVoluntario.deleteMany({
        where: { escalaId: escalaExistente.id, manual: false }
      });
      escala = escalaExistente;
    } else {
      escala = await prisma.escala.create({ data: { mes, ano } });
    }

    const manuaisExistentes = await prisma.escalaVoluntario.findMany({
      where: { escalaId: escala.id, manual: true }
    });

    const manuaisSet = new Set(
      manuaisExistentes.map(m => `${m.cultoId}::${m.funcao}`)
    );

    // Contagem mensal: quantas vezes cada voluntário foi escalado este mês
    const contagemMensal = new Map<string, number>();
    manuaisExistentes.forEach(m => {
      contagemMensal.set(m.voluntarioId, (contagemMensal.get(m.voluntarioId) || 0) + 1);
    });

    const cultosProcessados: any[] = [];
    const avisos: string[] = [];

    for (const culto of cultos) {
      const slotsRaw = culto.configEscala?.slots;
      let slots: Slot[] = getSlotsPadrao();
      if (slotsRaw && Array.isArray(slotsRaw) && slotsRaw.length > 0) {
        slots = (slotsRaw as Slot[]).filter(s => s.codigo && s.qtd > 0);
      }
      const nivelBanda = culto.configEscala?.nivelBanda || 'EQUILIBRADA';

      const jaEscalados = new Set<string>();

      // Marcar voluntários manuais como já escalados
      manuaisExistentes
        .filter(m => m.cultoId === culto.id)
        .forEach(m => jaEscalados.add(m.voluntarioId));

      // Garantir mínimo 1 ministro: processar MINISTRO primeiro
      const slotsOrdenados = [...slots].sort((a, b) => {
        if (a.codigo === 'MINISTRO') return -1;
        if (b.codigo === 'MINISTRO') return 1;
        return 0;
      });

      for (const slot of slotsOrdenados) {
        for (let i = 1; i <= slot.qtd; i++) {
          const funcao = `${slot.codigo}_${i}`;

          if (manuaisSet.has(`${culto.id}::${funcao}`)) {
            continue;
          }

          const voluntarioSelecionado = selecionarVoluntario(
            funcao,
            slot.codigo,
            voluntarios as any[],
            culto.redeResponsavel,
            culto.data,
            ausencias as any[],
            cultosProcessados,
            jaEscalados,
            contagemMensal,
            nivelBanda
          );

          if (voluntarioSelecionado) {
            await prisma.escalaVoluntario.create({
              data: {
                escalaId: escala.id,
                cultoId: culto.id,
                voluntarioId: voluntarioSelecionado.id,
                funcao
              }
            });
            jaEscalados.add(voluntarioSelecionado.id);
            contagemMensal.set(
              voluntarioSelecionado.id,
              (contagemMensal.get(voluntarioSelecionado.id) || 0) + 1
            );
          } else if (slot.codigo === 'MINISTRO') {
            avisos.push(`Sem ministro disponível para culto de ${new Date(culto.data).toLocaleDateString('pt-BR')}`);
          }
        }
      }

      // Validação pós-geração: não ter apenas novos no culto
      const voluntariosNoCulto = await prisma.escalaVoluntario.findMany({
        where: { cultoId: culto.id, escalaId: escala.id },
        include: { voluntario: true }
      });

      const temMinistro = voluntariosNoCulto.some(ev => extractCodigo(ev.funcao) === 'MINISTRO');
      if (!temMinistro && slots.some(s => s.codigo === 'MINISTRO' && s.qtd > 0)) {
        avisos.push(`Culto ${new Date(culto.data).toLocaleDateString('pt-BR')}: nenhum ministro escalado`);
      }

      const niveis = voluntariosNoCulto.map(ev => ev.voluntario?.nivel);
      const todosNovos = niveis.length > 0 && niveis.every(n => n === 'NOVO');
      if (todosNovos && niveis.length > 1) {
        avisos.push(`Culto ${new Date(culto.data).toLocaleDateString('pt-BR')}: apenas voluntários novos escalados`);
      }

      cultosProcessados.push({ ...culto, voluntarios: voluntariosNoCulto });
    }

    const escalaCompleta = await prisma.escala.findUnique({
      where: { id: escala.id },
      include: {
        voluntarios: {
          include: { voluntario: true, culto: true }
        }
      }
    });

    const instrumentoConfigs = await prisma.instrumentoConfig.findMany({ orderBy: { ordem: 'asc' } });

    const cultosComVoluntarios = cultos.map((culto) => {
      const voluntariosDoCulto = escalaCompleta?.voluntarios?.filter((ev) => ev.cultoId === culto.id) ?? [];
      const slotsRaw = culto.configEscala?.slots;
      let slots: Slot[] = getSlotsPadrao();
      if (slotsRaw && Array.isArray(slotsRaw) && slotsRaw.length > 0) {
        slots = (slotsRaw as Slot[]).filter(s => s.codigo && s.qtd > 0);
      }
      return { ...culto, voluntarios: voluntariosDoCulto, slots };
    });

    return NextResponse.json({
      id: escala.id,
      mes: escala.mes,
      ano: escala.ano,
      cultos: cultosComVoluntarios,
      voluntariosDisponiveis: voluntarios,
      instrumentoConfigs: instrumentoConfigs.map(i => ({ codigo: i.codigo, nome: i.nome })),
      avisos
    });
  } catch (error: any) {
    console.error('Error generating escala:', error);
    return NextResponse.json({ error: 'Erro ao gerar escala' }, { status: 500 });
  }
}
