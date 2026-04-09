'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

type VoluntarioModalProps = {
  voluntario?: {
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
  } | null;
  onClose: () => void;
};

export function VoluntarioModal({ voluntario, onClose }: VoluntarioModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [instrumentoOptions, setInstrumentoOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    fetch('/api/instrumentos')
      .then(res => res.json())
      .then((data: { codigo: string; nome: string; ativo: boolean }[]) => {
        const ativos = data.filter(i => i.ativo);
        setInstrumentoOptions(ativos.map(i => ({ value: i.codigo, label: i.nome })));
      })
      .catch(() => {});
  }, []);

  const [formData, setFormData] = useState({
    nome: '',
    dataNascimento: '',
    email: '',
    rede: 'BRANCA',
    qualGC: '',
    discipulador: '',
    instrumentos: [] as string[],
    ministro: false,
    diretorCulto: false,
    nivel: 'MEDIO',
    ativo: true
  });

  useEffect(() => {
    if (voluntario) {
      const dataFormatada = voluntario.dataNascimento
        ? new Date(voluntario.dataNascimento).toISOString().split('T')[0]
        : '';
      setFormData({
        nome: voluntario.nome,
        dataNascimento: dataFormatada,
        email: voluntario.email,
        rede: voluntario.rede,
        qualGC: voluntario.qualGC ?? '',
        discipulador: voluntario.discipulador ?? '',
        instrumentos: voluntario.instrumentos,
        ministro: voluntario.ministro,
        diretorCulto: voluntario.diretorCulto,
        nivel: voluntario.nivel,
        ativo: voluntario.ativo
      });
    }
  }, [voluntario]);

  const handleInstrumentoToggle = (instrumento: string) => {
    setFormData((prev) => ({
      ...prev,
      instrumentos: prev.instrumentos.includes(instrumento)
        ? prev.instrumentos.filter((i) => i !== instrumento)
        : [...prev.instrumentos, instrumento]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = voluntario ? `/api/voluntarios/${voluntario.id}` : '/api/voluntarios';
      const method = voluntario ? 'PUT' : 'POST';

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
        alert(data.error || 'Erro ao salvar voluntário');
      }
    } catch (error) {
      alert('Erro ao salvar voluntário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 w-full max-w-2xl my-8"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <h2 className="text-2xl font-bold">
              {voluntario ? 'Editar Voluntário' : 'Novo Voluntário'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-rede-roxa"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  value={formData.dataNascimento}
                  onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-rede-roxa"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-rede-roxa"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rede *
                </label>
                <select
                  value={formData.rede}
                  onChange={(e) => setFormData({ ...formData, rede: e.target.value })}
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
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nível *
                </label>
                <select
                  value={formData.nivel}
                  onChange={(e) => setFormData({ ...formData, nivel: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-rede-roxa"
                  required
                >
                  <option value="NOVO">Novo</option>
                  <option value="MEDIO">Médio</option>
                  <option value="EXPERIENTE">Experiente</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Qual GC
                </label>
                <input
                  type="text"
                  value={formData.qualGC}
                  onChange={(e) => setFormData({ ...formData, qualGC: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-rede-roxa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Discipulador
                </label>
                <input
                  type="text"
                  value={formData.discipulador}
                  onChange={(e) => setFormData({ ...formData, discipulador: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-rede-roxa"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Instrumentos que toca *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {instrumentoOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.instrumentos.includes(option.value)}
                      onChange={() => handleInstrumentoToggle(option.value)}
                      className="w-4 h-4 rounded bg-gray-800 border-gray-700 text-rede-roxa focus:ring-rede-roxa"
                    />
                    <span className="text-sm text-gray-300">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.ministro}
                  onChange={(e) => setFormData({ ...formData, ministro: e.target.checked })}
                  className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-rede-roxa focus:ring-rede-roxa"
                />
                <span className="text-sm font-medium text-gray-300">É Ministro</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.diretorCulto}
                  onChange={(e) => setFormData({ ...formData, diretorCulto: e.target.checked })}
                  className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-rede-roxa focus:ring-rede-roxa"
                />
                <span className="text-sm font-medium text-gray-300">É Diretor Musical</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-rede-roxa focus:ring-rede-roxa"
                />
                <span className="text-sm font-medium text-gray-300">Ativo</span>
              </label>
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
                disabled={loading || formData.instrumentos.length === 0}
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
