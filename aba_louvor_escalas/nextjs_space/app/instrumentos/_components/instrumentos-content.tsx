'use client';

import { useState, useCallback } from 'react';
import { Guitar, Plus, Trash2, Edit, Search, GripVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { InstrumentoModal } from './instrumento-modal';

type InstrumentoConfig = {
  id: string;
  codigo: string;
  nome: string;
  ativo: boolean;
  ordem: number;
  totalVoluntarios: number;
};

type Props = {
  instrumentos: InstrumentoConfig[];
};

export function InstrumentosContent({ instrumentos: initialInstrumentos }: Props) {
  const [instrumentos, setInstrumentos] = useState(initialInstrumentos);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<InstrumentoConfig | null>(null);
  const [busca, setBusca] = useState('');

  const refreshData = useCallback(async () => {
    try {
      const res = await fetch('/api/instrumentos');
      if (res.ok) {
        const data = await res.json();
        setInstrumentos(data);
      }
    } catch {}
  }, []);

  const filtrados = instrumentos.filter(i =>
    i.nome.toLowerCase().includes(busca.toLowerCase()) ||
    i.codigo.toLowerCase().includes(busca.toLowerCase())
  );

  const handleDelete = async (instrumento: InstrumentoConfig) => {
    if (!confirm(`Deseja excluir o instrumento "${instrumento.nome}"?`)) return;
    try {
      const res = await fetch(`/api/instrumentos/${instrumento.id}`, { method: 'DELETE' });
      if (res.ok) {
        setInstrumentos(prev => prev.filter(i => i.id !== instrumento.id));
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao excluir');
      }
    } catch {
      alert('Erro ao excluir instrumento');
    }
  };

  const handleToggleAtivo = async (instrumento: InstrumentoConfig) => {
    try {
      const res = await fetch(`/api/instrumentos/${instrumento.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !instrumento.ativo })
      });
      if (res.ok) {
        setInstrumentos(prev => prev.map(i =>
          i.id === instrumento.id ? { ...i, ativo: !i.ativo } : i
        ));
      }
    } catch {
      alert('Erro ao atualizar');
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Guitar className="h-8 w-8 text-rede-amarela" />
            <h1 className="text-3xl font-bold">Instrumentos</h1>
          </div>
          <button
            onClick={() => { setEditando(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rede-roxa to-rede-amarela text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="h-5 w-5" />
            Novo Instrumento
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar instrumento..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rede-roxa"
          />
        </div>

        {/* List */}
        <div className="space-y-3">
          {filtrados.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Guitar className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Nenhum instrumento encontrado</p>
            </div>
          ) : (
            filtrados.map((instrumento, index) => (
              <motion.div
                key={instrumento.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  instrumento.ativo
                    ? 'bg-gray-900/80 border-gray-800 hover:border-gray-700'
                    : 'bg-gray-900/30 border-gray-800/50 opacity-60'
                }`}
              >
                <div className="flex items-center gap-4">
                  <GripVertical className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">{instrumento.nome}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400 font-mono">
                        {instrumento.codigo}
                      </span>
                      {!instrumento.ativo && (
                        <span className="text-xs px-2 py-0.5 rounded bg-red-900/50 text-red-400">Inativo</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {instrumento.totalVoluntarios} voluntário{instrumento.totalVoluntarios !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleAtivo(instrumento)}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                      instrumento.ativo
                        ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {instrumento.ativo ? 'Ativo' : 'Inativo'}
                  </button>
                  <button
                    onClick={() => { setEditando(instrumento); setShowModal(true); }}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-rede-amarela"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(instrumento)}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {showModal && (
        <InstrumentoModal
          instrumento={editando}
          onClose={() => { setShowModal(false); setEditando(null); refreshData(); }}
        />
      )}
    </main>
  );
}
