'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Calendar, UserX, Music, BarChart3, TrendingUp, TrendingDown, Award, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

type Culto = {
  id: string;
  data: Date;
  especial: boolean;
  redeResponsavel: string;
  descricao: string | null;
};

type DashboardContentProps = {
  stats: {
    totalVoluntarios: number;
    totalCultos: number;
    totalAusencias: number;
    proximosCultos: Culto[];
  };
};

const redeColors: Record<string, string> = {
  BRANCA: 'text-white border-white',
  AMARELA: 'text-rede-amarela border-rede-amarela',
  LARANJA: 'text-rede-laranja border-rede-laranja',
  ROXA: 'text-rede-roxa border-rede-roxa'
};

const redeBgColors: Record<string, string> = {
  BRANCA: 'bg-white/10',
  AMARELA: 'bg-yellow-500/20',
  LARANJA: 'bg-orange-500/20',
  ROXA: 'bg-purple-500/20',
};

const nivelColors: Record<string, string> = {
  EXPERIENTE: 'text-green-400',
  MEDIO: 'text-yellow-400',
  NOVO: 'text-blue-400',
};

export function DashboardContent({ stats }: DashboardContentProps) {
  const [metricas, setMetricas] = useState<any>(null);
  const [loadingMetricas, setLoadingMetricas] = useState(false);
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear().toString());
  const [filtroMes, setFiltroMes] = useState((new Date().getMonth() + 1).toString());
  const [filtroTipo, setFiltroTipo] = useState<'mes' | 'ano'>('mes');

  const mesesNomes = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const carregarMetricas = useCallback(async () => {
    setLoadingMetricas(true);
    try {
      const params = new URLSearchParams({ ano: filtroAno });
      if (filtroTipo === 'mes') params.set('mes', filtroMes);
      const res = await fetch(`/api/dashboard/metricas?${params}`);
      if (res.ok) setMetricas(await res.json());
    } catch {} finally { setLoadingMetricas(false); }
  }, [filtroAno, filtroMes, filtroTipo]);

  useEffect(() => { carregarMetricas(); }, [carregarMetricas]);

  const statCards = [
    { title: 'Voluntários Ativos', value: stats?.totalVoluntarios ?? 0, icon: Users, color: 'from-blue-500 to-blue-600', href: '/voluntarios' },
    { title: 'Cultos Cadastrados', value: stats?.totalCultos ?? 0, icon: Calendar, color: 'from-rede-roxa to-purple-600', href: '/cultos' },
    { title: 'Ausências', value: stats?.totalAusencias ?? 0, icon: UserX, color: 'from-orange-500 to-red-600', href: '/ausencias' },
    { title: 'Gerar Escala', value: '', icon: Music, color: 'from-rede-amarela to-yellow-600', href: '/escalas' }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-rede-roxa to-rede-amarela bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-gray-400 mb-8">Gerencie suas escalas de louvor de forma eficiente</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
              <Link href={card.href}>
                <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-all hover:shadow-lg hover:shadow-purple-500/10 cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${card.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-gray-400 text-sm mb-1">{card.title}</h3>
                  {card.value !== '' ? (
                    <p className="text-3xl font-bold text-white">{card.value}</p>
                  ) : (
                    <p className="text-lg font-semibold text-rede-amarela">Acessar →</p>
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Métricas */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-rede-amarela" />
            <h2 className="text-2xl font-bold">Métricas</h2>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as 'mes' | 'ano')}
              className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-rede-roxa"
            >
              <option value="mes">Por Mês</option>
              <option value="ano">Por Ano</option>
            </select>
            {filtroTipo === 'mes' && (
              <select
                value={filtroMes}
                onChange={(e) => setFiltroMes(e.target.value)}
                className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-rede-roxa"
              >
                {mesesNomes.slice(1).map((nome, i) => (
                  <option key={i + 1} value={i + 1}>{nome}</option>
                ))}
              </select>
            )}
            <select
              value={filtroAno}
              onChange={(e) => setFiltroAno(e.target.value)}
              className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-rede-roxa"
            >
              {[2024, 2025, 2026, 2027].map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>

        {loadingMetricas ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-6 w-6 border-2 border-rede-roxa border-t-transparent rounded-full" />
            <span className="ml-3 text-gray-400">Carregando métricas...</span>
          </div>
        ) : metricas ? (
          <div className="space-y-6">
            {/* Resumo rápido */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                <p className="text-xs text-gray-500 mb-1">Cultos no período</p>
                <p className="text-2xl font-bold text-white">{metricas.totalCultosPeriodo}</p>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                <p className="text-xs text-gray-500 mb-1">Média participações</p>
                <p className="text-2xl font-bold text-rede-amarela">{metricas.mediaParticipacoes}</p>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                <p className="text-xs text-gray-500 mb-1">Ministros disponíveis</p>
                <p className="text-2xl font-bold text-purple-400">{metricas.totalMinistros}</p>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                <p className="text-xs text-gray-500 mb-1">Ausências ativas</p>
                <p className="text-2xl font-bold text-red-400">{metricas.ausenciasAtivas}</p>
              </div>
            </div>

            {/* Por Nível e Rede */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Voluntários por Nível</h3>
                <div className="space-y-3">
                  {(['EXPERIENTE', 'MEDIO', 'NOVO'] as const).map(nivel => {
                    const count = metricas.porNivel[nivel] || 0;
                    const pct = metricas.totalAtivos > 0 ? (count / metricas.totalAtivos * 100) : 0;
                    const labels: Record<string, string> = { EXPERIENTE: 'Experiente', MEDIO: 'Médio', NOVO: 'Novo' };
                    const colors: Record<string, string> = { EXPERIENTE: 'bg-green-500', MEDIO: 'bg-yellow-500', NOVO: 'bg-blue-500' };
                    return (
                      <div key={nivel}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className={nivelColors[nivel]}>{labels[nivel]}</span>
                          <span className="text-gray-400">{count} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2">
                          <div className={`${colors[nivel]} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Voluntários por Rede</h3>
                <div className="space-y-3">
                  {(['BRANCA', 'AMARELA', 'LARANJA', 'ROXA'] as const).map(rede => {
                    const count = metricas.porRede[rede] || 0;
                    const pct = metricas.totalAtivos > 0 ? (count / metricas.totalAtivos * 100) : 0;
                    const colors: Record<string, string> = { BRANCA: 'bg-gray-300', AMARELA: 'bg-yellow-400', LARANJA: 'bg-orange-500', ROXA: 'bg-purple-600' };
                    return (
                      <div key={rede}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className={redeColors[rede]?.split(' ')[0]}>Rede {rede}</span>
                          <span className="text-gray-400">{count} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2">
                          <div className={`${colors[rede]} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Rankings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mais serviram */}
              <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  <h3 className="text-sm font-semibold text-gray-300">Mais Serviram</h3>
                </div>
                {metricas.maisServiram?.length > 0 ? (
                  <div className="space-y-2">
                    {metricas.maisServiram.map((v: any, i: number) => (
                      <div key={v.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-800/50">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 w-5">{i + 1}.</span>
                          <span className="text-sm text-white">{v.nome}</span>
                          <span className={`text-[10px] ${nivelColors[v.nivel]}`}>{v.nivel}</span>
                        </div>
                        <span className="text-sm font-bold text-green-400">{v.count}x</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-600">Sem dados no período</p>}
              </div>

              {/* Menos serviram */}
              <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="h-5 w-5 text-orange-400" />
                  <h3 className="text-sm font-semibold text-gray-300">Menos Serviram</h3>
                </div>
                {metricas.menosServiram?.length > 0 ? (
                  <div className="space-y-2">
                    {metricas.menosServiram.map((v: any, i: number) => (
                      <div key={v.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-800/50">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 w-5">{i + 1}.</span>
                          <span className="text-sm text-white">{v.nome}</span>
                          <span className={`text-[10px] ${nivelColors[v.nivel]}`}>{v.nivel}</span>
                        </div>
                        <span className="text-sm font-bold text-orange-400">{v.count}x</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-600">Sem dados no período</p>}
              </div>
            </div>

            {/* Nunca escalados + Instrumentos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <h3 className="text-sm font-semibold text-gray-300">Nunca Escalados no Período</h3>
                </div>
                {metricas.nuncaEscalados?.length > 0 ? (
                  <div className="space-y-2">
                    {metricas.nuncaEscalados.map((v: any) => (
                      <div key={v.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-800/50">
                        <span className="text-sm text-white">{v.nome}</span>
                        <span className={`text-[10px] ${nivelColors[v.nivel]}`}>{v.nivel}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-green-400">✓ Todos os voluntários foram escalados!</p>}
              </div>

              <div className="bg-gray-900/50 rounded-xl p-5 border border-gray-800">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="h-5 w-5 text-rede-amarela" />
                  <h3 className="text-sm font-semibold text-gray-300">Funções mais Escaladas</h3>
                </div>
                {metricas.instrumentosRanking?.length > 0 ? (
                  <div className="space-y-2">
                    {metricas.instrumentosRanking.slice(0, 8).map((inst: any, i: number) => (
                      <div key={inst.codigo} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-800/50">
                        <span className="text-sm text-white">{inst.nome}</span>
                        <span className="text-sm font-bold text-rede-amarela">{inst.count}x</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-600">Sem dados no período</p>}
              </div>
            </div>
          </div>
        ) : null}
      </motion.div>

      {/* Próximos Cultos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800"
      >
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Calendar className="h-6 w-6 text-rede-roxa" />
          Próximos Cultos
        </h2>

        {(!stats?.proximosCultos || stats.proximosCultos.length === 0) ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">Nenhum culto cadastrado</p>
            <Link
              href="/cultos"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rede-roxa to-rede-amarela text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              <Calendar className="h-5 w-5" />
              Cadastrar Culto
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {stats.proximosCultos.map((culto) => {
              const dataFormatada = new Date(culto.data).toLocaleDateString('pt-BR', {
                day: '2-digit', month: 'long', year: 'numeric', weekday: 'long'
              });
              const colorClass = redeColors[culto.redeResponsavel] ?? 'text-white border-white';
              return (
                <div key={culto.id} className="bg-gray-800/30 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-white font-medium capitalize">{dataFormatada}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-sm font-semibold ${colorClass}`}>Rede {culto.redeResponsavel}</span>
                        {culto.especial && (
                          <span className="text-xs px-2 py-1 bg-rede-amarela/20 text-rede-amarela rounded-full font-semibold">Especial</span>
                        )}
                      </div>
                      {culto.descricao && <p className="text-sm text-gray-400 mt-1">{culto.descricao}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
