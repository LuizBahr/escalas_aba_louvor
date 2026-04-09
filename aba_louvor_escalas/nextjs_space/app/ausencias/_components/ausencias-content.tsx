'use client';

import { useState, useCallback } from 'react';
import { UserX, Plus, Upload, Trash2, Edit, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { AusenciaModal } from './ausencia-modal';
import { ImportExcelModal } from './import-excel-modal';

type Voluntario = {
  id: string;
  nome: string;
  email: string;
};

type Ausencia = {
  id: string;
  voluntarioId: string;
  dataInicio: Date;
  dataFim: Date | null;
  motivo: string | null;
  voluntario: Voluntario;
};

type AusenciasContentProps = {
  ausencias: Ausencia[];
  voluntarios: Voluntario[];
};

export function AusenciasContent({ ausencias: initialAusencias, voluntarios }: AusenciasContentProps) {
  const [ausencias, setAusencias] = useState(initialAusencias);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingAusencia, setEditingAusencia] = useState<Ausencia | null>(null);

  const refreshData = useCallback(async () => {
    try {
      const res = await fetch('/api/ausencias');
      if (res.ok) {
        const data = await res.json();
        setAusencias(data);
      }
    } catch {}
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta ausência?')) return;

    try {
      const response = await fetch(`/api/ausencias/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setAusencias(ausencias.filter((a) => a.id !== id));
      } else {
        alert('Erro ao excluir ausência');
      }
    } catch (error) {
      alert('Erro ao excluir ausência');
    }
  };

  const handleEdit = (ausencia: Ausencia) => {
    setEditingAusencia(ausencia);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingAusencia(null);
    refreshData();
  };

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
              Ausências
            </h1>
            <p className="text-gray-400">Gerencie as ausências dos voluntários</p>
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
              Nova Ausência
            </button>
          </div>
        </div>
      </motion.div>

      {/* Ausências List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {ausencias.length === 0 ? (
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-12 border border-gray-800 text-center">
            <UserX className="h-16 w-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">Nenhuma ausência cadastrada</p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rede-roxa to-rede-amarela text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus className="h-5 w-5" />
              Cadastrar Primeira Ausência
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {ausencias.map((ausencia) => {
              const dataInicioFormatada = new Date(ausencia.dataInicio).toLocaleDateString('pt-BR');
              const dataFimFormatada = ausencia.dataFim
                ? new Date(ausencia.dataFim).toLocaleDateString('pt-BR')
                : 'Até hoje';

              const hoje = new Date();
              const inicio = new Date(ausencia.dataInicio);
              const fim = ausencia.dataFim ? new Date(ausencia.dataFim) : new Date('2099-12-31');
              const isAtivo = hoje >= inicio && hoje <= fim;

              return (
                <div
                  key={ausencia.id}
                  className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <UserX className="h-5 w-5 text-rede-laranja" />
                        <h3 className="text-xl font-semibold text-white">{ausencia.voluntario?.nome}</h3>
                        {isAtivo && (
                          <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-semibold">
                            Ausente agora
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-400">Início:</span>
                          <span className="text-white font-medium">{dataInicioFormatada}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-400">Fim:</span>
                          <span className="text-white font-medium">{dataFimFormatada}</span>
                        </div>
                      </div>

                      {ausencia.motivo && (
                        <p className="text-gray-400 mt-3 text-sm">
                          <strong>Motivo:</strong> {ausencia.motivo}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(ausencia)}
                        className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(ausencia.id)}
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
        <AusenciaModal
          ausencia={editingAusencia}
          voluntarios={voluntarios}
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
