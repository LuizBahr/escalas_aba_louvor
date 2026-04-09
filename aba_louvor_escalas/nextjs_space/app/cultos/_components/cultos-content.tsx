'use client';

import { useState, useCallback } from 'react';
import { Calendar, Plus, Upload, Filter, Trash2, Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import { CultoModal } from './culto-modal';
import { ImportExcelModal } from './import-excel-modal';

type Culto = {
  id: string;
  data: Date;
  especial: boolean;
  redeResponsavel: string;
  descricao: string | null;
};

type CultosContentProps = {
  cultos: Culto[];
};

const redeColors: Record<string, string> = {
  BRANCA: 'bg-white text-black',
  AMARELA: 'bg-rede-amarela text-black',
  LARANJA: 'bg-rede-laranja text-white',
  ROXA: 'bg-rede-roxa text-white'
};

export function CultosContent({ cultos: initialCultos }: CultosContentProps) {
  const [cultos, setCultos] = useState(initialCultos);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingCulto, setEditingCulto] = useState<Culto | null>(null);
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterEspecial, setFilterEspecial] = useState<string>('');

  const refreshData = useCallback(async () => {
    try {
      const res = await fetch('/api/cultos');
      if (res.ok) {
        const data = await res.json();
        setCultos(data);
      }
    } catch {}
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este culto?')) return;

    try {
      const response = await fetch(`/api/cultos/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setCultos(cultos.filter((c) => c.id !== id));
      } else {
        alert('Erro ao excluir culto');
      }
    } catch (error) {
      alert('Erro ao excluir culto');
    }
  };

  const handleEdit = (culto: Culto) => {
    setEditingCulto(culto);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingCulto(null);
    refreshData();
  };

  const filteredCultos = cultos.filter((culto) => {
    const cultoDat = new Date(culto.data);
    const cultoMonth = `${cultoDat.getFullYear()}-${String(cultoDat.getMonth() + 1).padStart(2, '0')}`;

    const monthMatch = !filterMonth || cultoMonth === filterMonth;
    const especialMatch = !filterEspecial || 
      (filterEspecial === 'sim' && culto.especial) ||
      (filterEspecial === 'nao' && !culto.especial);

    return monthMatch && especialMatch;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-rede-roxa to-rede-amarela bg-clip-text text-transparent">
              Cultos
            </h1>
            <p className="text-gray-400">Gerencie os cultos da igreja</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Upload className="h-5 w-5" />
              Importar Excel
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-rede-roxa to-rede-amarela text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus className="h-5 w-5" />
              Novo Culto
            </button>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 mb-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-rede-roxa" />
          <h2 className="text-lg font-semibold">Filtros</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Mês</label>
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-rede-roxa"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Culto Especial</label>
            <select
              value={filterEspecial}
              onChange={(e) => setFilterEspecial(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-rede-roxa"
            >
              <option value="">Todos</option>
              <option value="sim">Sim</option>
              <option value="nao">Não</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Cultos List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {filteredCultos.length === 0 ? (
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-12 border border-gray-800 text-center">
            <Calendar className="h-16 w-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">Nenhum culto encontrado</p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rede-roxa to-rede-amarela text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus className="h-5 w-5" />
              Cadastrar Primeiro Culto
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredCultos.map((culto) => {
              const dataFormatada = new Date(culto.data).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                weekday: 'long'
              });
              const colorClass = redeColors[culto.redeResponsavel] ?? 'bg-white text-black';

              return (
                <div
                  key={culto.id}
                  className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="h-5 w-5 text-rede-roxa" />
                        <h3 className="text-xl font-semibold text-white capitalize">{dataFormatada}</h3>
                        {culto.especial && (
                          <span className="px-3 py-1 bg-rede-amarela/20 text-rede-amarela rounded-full text-sm font-semibold">
                            Especial
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${colorClass}`}>
                          Rede {culto.redeResponsavel}
                        </span>
                      </div>
                      {culto.descricao && (
                        <p className="text-gray-400 mt-3">{culto.descricao}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(culto)}
                        className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(culto.id)}
                        className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {showModal && (
        <CultoModal
          culto={editingCulto}
          onClose={handleModalClose}
        />
      )}

      {showImportModal && (
        <ImportExcelModal
          onClose={() => {
            setShowImportModal(false);
            refreshData();
          }}
        />
      )}
    </div>
  );
}
