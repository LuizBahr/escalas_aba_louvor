'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Upload, Trash2, Edit, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { VoluntarioModal } from './voluntario-modal';
import { ImportExcelModal } from './import-excel-modal';

type Voluntario = {
  id: string;
  nome: string;
  dataNascimento: Date | null;
  email: string;
  rede: string;
  qualGC: string | null;
  discipulador: string | null;
  instrumentos: string[];
  ministro: boolean;
  diretorCulto: boolean;
  nivel: string;
  ativo: boolean;
};

type VoluntariosContentProps = {
  voluntarios: Voluntario[];
};

const nivelLabels: Record<string, string> = {
  EXPERIENTE: 'Experiente',
  MEDIO: 'Médio',
  NOVO: 'Novo'
};

const nivelColors: Record<string, string> = {
  EXPERIENTE: 'bg-green-500/20 text-green-400',
  MEDIO: 'bg-yellow-500/20 text-yellow-400',
  NOVO: 'bg-blue-500/20 text-blue-400'
};

export function VoluntariosContent({ voluntarios: initialVoluntarios }: VoluntariosContentProps) {
  const [voluntarios, setVoluntarios] = useState(initialVoluntarios);
  const [showModal, setShowModal] = useState(false);
  const [instrumentoLabels, setInstrumentoLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/instrumentos')
      .then(res => res.json())
      .then((data: { codigo: string; nome: string }[]) => {
        const labels: Record<string, string> = {};
        data.forEach(i => { labels[i.codigo] = i.nome; });
        setInstrumentoLabels(labels);
      })
      .catch(() => {});
  }, []);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingVoluntario, setEditingVoluntario] = useState<Voluntario | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const refreshData = useCallback(async () => {
    try {
      const res = await fetch('/api/voluntarios');
      if (res.ok) {
        const data = await res.json();
        setVoluntarios(data);
      }
    } catch {}
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este voluntário?')) return;

    try {
      const response = await fetch(`/api/voluntarios/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setVoluntarios(voluntarios.filter((v) => v.id !== id));
      } else {
        alert('Erro ao excluir voluntário');
      }
    } catch (error) {
      alert('Erro ao excluir voluntário');
    }
  };

  const handleEdit = (voluntario: Voluntario) => {
    setEditingVoluntario(voluntario);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingVoluntario(null);
    refreshData();
  };

  const filteredVoluntarios = voluntarios.filter((v) => {
    const search = searchTerm.toLowerCase();
    return (
      v?.nome?.toLowerCase()?.includes(search) ||
      v?.email?.toLowerCase()?.includes(search) ||
      v?.instrumentos?.some((i) => instrumentoLabels[i]?.toLowerCase()?.includes(search))
    );
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
              Voluntários
            </h1>
            <p className="text-gray-400">Gerencie os voluntários do ministério</p>
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
              Novo Voluntário
            </button>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 mb-6"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, email ou instrumento..."
            className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rede-roxa"
          />
        </div>
      </motion.div>

      {/* Voluntarios List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {filteredVoluntarios.length === 0 ? (
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-12 border border-gray-800 text-center">
            <Users className="h-16 w-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">
              {searchTerm ? 'Nenhum voluntário encontrado' : 'Nenhum voluntário cadastrado'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rede-roxa to-rede-amarela text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                <Plus className="h-5 w-5" />
                Cadastrar Primeiro Voluntário
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredVoluntarios.map((voluntario) => {
              const nivelColor = nivelColors[voluntario.nivel] ?? 'bg-gray-500/20 text-gray-400';
              const nivelLabel = nivelLabels[voluntario.nivel] ?? voluntario.nivel;

              return (
                <div
                  key={voluntario.id}
                  className={`bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border transition-all ${
                    voluntario.ativo
                      ? 'border-gray-800 hover:border-gray-700'
                      : 'border-gray-800/50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-white">{voluntario.nome}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${nivelColor}`}>
                          {nivelLabel}
                        </span>
                        {!voluntario.ativo && (
                          <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-semibold">
                            Inativo
                          </span>
                        )}
                      </div>

                      <p className="text-gray-400 text-sm mb-3">{voluntario.email}</p>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {voluntario?.instrumentos?.map((instrumento) => (
                          <span
                            key={instrumento}
                            className="px-3 py-1 bg-rede-roxa/20 text-rede-roxa rounded-lg text-sm font-medium"
                          >
                            {instrumentoLabels[instrumento] ?? instrumento}
                          </span>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="text-gray-400">
                          Rede: <span className="text-white font-medium">{voluntario.rede}</span>
                        </span>
                        {voluntario.ministro && (
                          <span className="px-2 py-1 bg-rede-amarela/20 text-rede-amarela rounded text-xs font-semibold">
                            Ministro
                          </span>
                        )}
                        {voluntario.diretorCulto && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-semibold">
                            Diretor Musical
                          </span>
                        )}
                      </div>

                      {(voluntario.qualGC || voluntario.discipulador) && (
                        <div className="flex gap-4 text-sm mt-2">
                          {voluntario.qualGC && (
                            <span className="text-gray-400">
                              GC: <span className="text-white">{voluntario.qualGC}</span>
                            </span>
                          )}
                          {voluntario.discipulador && (
                            <span className="text-gray-400">
                              Discipulador: <span className="text-white">{voluntario.discipulador}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(voluntario)}
                        className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(voluntario.id)}
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
        <VoluntarioModal
          voluntario={editingVoluntario}
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
