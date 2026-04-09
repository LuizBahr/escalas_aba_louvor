'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

type CultoModalProps = {
  culto?: {
    id: string;
    data: Date;
    especial: boolean;
    redeResponsavel: string;
    descricao: string | null;
  } | null;
  onClose: () => void;
};

export function CultoModal({ culto, onClose }: CultoModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    data: '',
    especial: false,
    redeResponsavel: 'BRANCA',
    descricao: ''
  });

  useEffect(() => {
    if (culto) {
      const dataFormatada = new Date(culto.data).toISOString().split('T')[0];
      setFormData({
        data: dataFormatada,
        especial: culto.especial,
        redeResponsavel: culto.redeResponsavel,
        descricao: culto.descricao ?? ''
      });
    }
  }, [culto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = culto ? `/api/cultos/${culto.id}` : '/api/cultos';
      const method = culto ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        router.refresh();
        onClose();
      } else {
        alert('Erro ao salvar culto');
      }
    } catch (error) {
      alert('Erro ao salvar culto');
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
              {culto ? 'Editar Culto' : 'Novo Culto'}
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
                Data do Culto *
              </label>
              <input
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-rede-roxa"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Rede Responsável *
              </label>
              <select
                value={formData.redeResponsavel}
                onChange={(e) => setFormData({ ...formData, redeResponsavel: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-rede-roxa"
                required
              >
                <option value="BRANCA">Rede Branca</option>
                <option value="AMARELA">Rede Amarela</option>
                <option value="LARANJA">Rede Laranja</option>
                <option value="ROXA">Rede Roxa</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.especial}
                  onChange={(e) => setFormData({ ...formData, especial: e.target.checked })}
                  className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-rede-roxa focus:ring-rede-roxa"
                />
                <span className="text-sm font-medium text-gray-300">Culto Especial</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Descrição (opcional)
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-rede-roxa"
                rows={3}
                placeholder="Ex: Natal, Páscoa, Aniversário da Igreja..."
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
