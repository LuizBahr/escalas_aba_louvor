'use client';

import { useState, useEffect } from 'react';
import { Settings, Calendar, ChevronDown, ChevronUp, Copy, Plus, Minus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

type InstrumentoDisponivel = {
  id: string;
  codigo: string;
  nome: string;
};

type Slot = { codigo: string; qtd: number };

type CultoConfig = {
  id: string;
  data: string;
  especial: boolean;
  redeResponsavel: string;
  descricao: string | null;
  slots: Slot[];
  nivelBanda: string;
};

type Props = {
  mes: string;
  ano: string;
  onConfirmar: () => void;
  onVoltar: () => void;
  loading: boolean;
};

const redeColors: Record<string, string> = {
  BRANCA: 'bg-white/20 text-white border-white/30',
  AMARELA: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  LARANJA: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  ROXA: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
};

const redeLabels: Record<string, string> = {
  BRANCA: 'Branca', AMARELA: 'Amarela', LARANJA: 'Laranja', ROXA: 'Roxa'
};

const mesesNomes = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function ConfigCultos({ mes, ano, onConfirmar, onVoltar, loading }: Props) {
  const [cultos, setCultos] = useState<CultoConfig[]>([]);
  const [instrumentos, setInstrumentos] = useState<InstrumentoDisponivel[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [expandido, setExpandido] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/escalas/config?mes=${mes}&ano=${ano}`)
      .then(res => res.json())
      .then(data => {
        setCultos(data.cultos || []);
        setInstrumentos(data.instrumentosDisponiveis || []);
        if (data.cultos?.length > 0) setExpandido(data.cultos[0].id);
      })
      .catch(() => alert('Erro ao carregar cultos'))
      .finally(() => setLoadingData(false));
  }, [mes, ano]);

  const getNomeInstrumento = (codigo: string) => {
    return instrumentos.find(i => i.codigo === codigo)?.nome || codigo;
  };

  const updateSlotQtd = (cultoId: string, slotIdx: number, delta: number) => {
    setCultos(prev => prev.map(c => {
      if (c.id !== cultoId) return c;
      const newSlots = [...c.slots];
      const newQtd = Math.max(0, newSlots[slotIdx].qtd + delta);
      if (newQtd === 0) {
        newSlots.splice(slotIdx, 1);
      } else {
        newSlots[slotIdx] = { ...newSlots[slotIdx], qtd: newQtd };
      }
      return { ...c, slots: newSlots };
    }));
  };

  const removeSlot = (cultoId: string, slotIdx: number) => {
    setCultos(prev => prev.map(c => {
      if (c.id !== cultoId) return c;
      const newSlots = [...c.slots];
      newSlots.splice(slotIdx, 1);
      return { ...c, slots: newSlots };
    }));
  };

  const addSlot = (cultoId: string, codigo: string) => {
    setCultos(prev => prev.map(c => {
      if (c.id !== cultoId) return c;
      // Se já existe, incrementar qtd
      const existingIdx = c.slots.findIndex(s => s.codigo === codigo);
      if (existingIdx >= 0) {
        const newSlots = [...c.slots];
        newSlots[existingIdx] = { ...newSlots[existingIdx], qtd: newSlots[existingIdx].qtd + 1 };
        return { ...c, slots: newSlots };
      }
      return { ...c, slots: [...c.slots, { codigo, qtd: 1 }] };
    }));
  };

  const setNivelBanda = (cultoId: string, nivel: string) => {
    setCultos(prev => prev.map(c => c.id === cultoId ? { ...c, nivelBanda: nivel } : c));
  };

  const copiarParaTodos = (cultoOrigem: CultoConfig) => {
    setCultos(prev => prev.map(c => {
      if (c.id === cultoOrigem.id) return c;
      return { ...c, slots: cultoOrigem.slots.map(s => ({ ...s })), nivelBanda: cultoOrigem.nivelBanda };
    }));
  };

  const handleSalvarEGerar = async () => {
    setSalvando(true);
    try {
      const configs = cultos.map(c => ({ cultoId: c.id, slots: c.slots, nivelBanda: c.nivelBanda }));
      const res = await fetch('/api/escalas/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs })
      });
      if (!res.ok) { alert('Erro ao salvar configurações'); return; }
      onConfirmar();
    } catch { alert('Erro ao salvar configurações'); }
    finally { setSalvando(false); }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return `${dias[d.getUTCDay()]}, ${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  };

  const getTotalSlots = (culto: CultoConfig) => culto.slots.reduce((s, sl) => s + sl.qtd, 0);

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-rede-roxa border-t-transparent rounded-full"></div>
        <span className="ml-3 text-gray-400">Carregando cultos...</span>
      </div>
    );
  }

  if (cultos.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-600" />
        <p className="text-xl text-gray-400">Nenhum culto cadastrado para {mesesNomes[parseInt(mes)]} de {ano}</p>
        <button onClick={onVoltar} className="mt-4 px-6 py-2 bg-gray-800 rounded-lg hover:bg-gray-700">Voltar</button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-6 w-6 text-rede-amarela" />
          <h2 className="text-xl font-bold">Configurar Cultos — {mesesNomes[parseInt(mes)]} {ano}</h2>
        </div>
        <p className="text-sm text-gray-400 mb-6">
          Defina livremente quantos de cada instrumento/função cada culto precisa.
        </p>

        <div className="space-y-3">
          {cultos.map((culto) => {
            const isExpanded = expandido === culto.id;
            return (
              <div key={culto.id} className="border border-gray-800 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandido(isExpanded ? null : culto.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold">{formatDate(culto.data)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded border ${redeColors[culto.redeResponsavel] || 'bg-gray-700 text-gray-300'}`}>
                      Rede {redeLabels[culto.redeResponsavel] || culto.redeResponsavel}
                    </span>
                    {culto.especial && <span className="text-xs px-2 py-0.5 rounded bg-rede-amarela/20 text-rede-amarela border border-rede-amarela/30">Especial</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{getTotalSlots(culto)} posições</span>
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 border-t border-gray-800 bg-gray-900/50 space-y-4">
                    {/* Nível da banda */}
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Nível da banda:</label>
                      <div className="flex gap-2">
                        {[
                          { value: 'EXPERIENTE', label: '100% Experiente', color: 'bg-green-600/20 text-green-400 border-green-500/40' },
                          { value: 'INTERMEDIARIA', label: 'Intermediária', color: 'bg-yellow-600/20 text-yellow-400 border-yellow-500/40' },
                          { value: 'EQUILIBRADA', label: 'Equilibrada', color: 'bg-blue-600/20 text-blue-400 border-blue-500/40' },
                        ].map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setNivelBanda(culto.id, opt.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                              culto.nivelBanda === opt.value
                                ? opt.color + ' ring-1 ring-offset-1 ring-offset-gray-900'
                                : 'bg-gray-800/50 border-gray-700 text-gray-500 hover:text-gray-300'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Lista de slots */}
                    <div className="space-y-2">
                      {culto.slots.map((slot, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3">
                          <span className="flex-1 font-medium text-sm text-gray-200">
                            {getNomeInstrumento(slot.codigo)}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateSlotQtd(culto.id, idx, -1)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center text-lg font-bold text-rede-amarela">{slot.qtd}</span>
                            <button
                              onClick={() => updateSlotQtd(culto.id, idx, 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => removeSlot(culto.id, idx)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-900/50 text-gray-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Adicionar instrumento */}
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Adicionar instrumento/função:</label>
                      <div className="flex flex-wrap gap-2">
                        {instrumentos
                          .filter(inst => !culto.slots.some(s => s.codigo === inst.codigo))
                          .map(inst => (
                            <button
                              key={inst.codigo}
                              onClick={() => addSlot(culto.id, inst.codigo)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800/50 border border-gray-700 text-gray-400 hover:border-rede-roxa hover:text-white transition-all"
                            >
                              <Plus className="h-3 w-3" /> {inst.nome}
                            </button>
                          ))}
                        {instrumentos.filter(inst => !culto.slots.some(s => s.codigo === inst.codigo)).length === 0 && (
                          <span className="text-xs text-gray-600">Todos os instrumentos já foram adicionados. Aumente a quantidade dos existentes ou cadastre novos em Instrumentos.</span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => copiarParaTodos(culto)}
                      className="flex items-center gap-2 text-sm text-rede-amarela hover:text-yellow-300 transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                      Copiar esta configuração para todos os cultos
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onVoltar} className="flex-1 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold">
          ← Voltar
        </button>
        <button
          onClick={handleSalvarEGerar}
          disabled={salvando || loading}
          className="flex-[2] px-6 py-3 bg-gradient-to-r from-rede-roxa to-rede-amarela text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {salvando || loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              {salvando ? 'Salvando...' : 'Gerando escala...'}
            </span>
          ) : 'Salvar e Gerar Escala'}
        </button>
      </div>
    </motion.div>
  );
}
