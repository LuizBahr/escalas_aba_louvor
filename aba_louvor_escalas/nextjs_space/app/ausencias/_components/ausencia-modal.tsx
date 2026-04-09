'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

type Voluntario = {
  id: string;
  nome: string;
  email: string;
};

type AusenciaModalProps = {
  ausencia?: {
    id: string;
    voluntarioId: string;
    dataInicio: Date;
    dataFim: Date | null;
    motivo: string | null;
  } | null;
  voluntarios: Voluntario[];
  onClose: () => void;
};

export function AusenciaModal({ ausencia, voluntarios, onClose }: AusenciaModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    voluntarioId: '',
    dataInicio: '',
    dataFim: '',
    motivo: ''
  });

  useEffect(() => {
    if (ausencia) {
      const dataInicioFormatada = new Date(ausencia.dataInicio).toISOString().split('T')[0];
      const dataFimFormatada = ausencia.dataFim
        ? new Date(ausencia.dataFim).toISOString().split('T')[0]
        : '';
      setFormData({
        voluntarioId: ausencia.voluntarioId,
        dataInicio: dataInicioFormatada,
        dataFim: dataFimFormatada,
        motivo: ausencia.motivo ?? ''
      });
    }
  }, [ausencia]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = ausencia ? `/api/ausencias/${ausencia.id}` : '/api/ausencias';
      const method = ausencia ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        router.refresh();
        onClose();
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao salvar ausência');
      }
    } catch (error) {
      alert('Erro ao salvar ausência');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 w-full max-w-md"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <h2 className="text-2xl font-bold">
              {ausencia ? 'Editar Ausência' : 'Nova Ausência'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Voluntário *
              </label>
              <select
                value={formData.voluntarioId}
                onChange={(e) => setFormData({ ...formData, voluntarioId: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-rede-roxa"
                required
              >
                <option value="">Selecione um voluntário</option>
                {voluntarios.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data de Início *
              </label>
              <input
                type="date"
                value={formData.dataInicio}
                onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-rede-roxa"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Data de Fim (opcional)
              </label>
              <input
                type="date"
                value={formData.dataFim}
                onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-rede-roxa"
              />
              <p className="text-xs text-gray-500 mt-1">
                Deixe em branco se não souber a data de retorno
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Motivo (opcional)
              </label>
              <textarea
                value={formData.motivo}
                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-rede-roxa"
                rows={3}
                placeholder="Ex: Viagem, compromisso, férias..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-rede-roxa to-rede-amarela text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
