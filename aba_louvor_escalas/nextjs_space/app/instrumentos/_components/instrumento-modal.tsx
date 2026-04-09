'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

type Props = {
  instrumento?: {
    id: string;
    codigo: string;
    nome: string;
    ativo: boolean;
    ordem: number;
  } | null;
  onClose: () => void;
};

function gerarCodigo(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

export function InstrumentoModal({ instrumento, onClose }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState('');
  const [codigoManual, setCodigoManual] = useState(false);

  useEffect(() => {
    if (instrumento) {
      setNome(instrumento.nome);
      setCodigo(instrumento.codigo);
      setCodigoManual(true);
    }
  }, [instrumento]);

  const handleNomeChange = (value: string) => {
    setNome(value);
    if (!codigoManual && !instrumento) {
      setCodigo(gerarCodigo(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !codigo.trim()) return;
    setLoading(true);

    try {
      const url = instrumento ? `/api/instrumentos/${instrumento.id}` : '/api/instrumentos';
      const method = instrumento ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome.trim(), codigo: codigo.trim() })
      });

      if (res.ok) {
        router.refresh();
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao salvar instrumento');
      }
    } catch {
      alert('Erro ao salvar instrumento');
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
              {instrumento ? 'Editar Instrumento' : 'Novo Instrumento'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nome *</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => handleNomeChange(e.target.value)}
                placeholder="Ex: Saxofone, Flauta, Percussão..."
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-rede-roxa"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Código *</label>
              <input
                type="text"
                value={codigo}
                onChange={(e) => { setCodigo(e.target.value.toUpperCase()); setCodigoManual(true); }}
                placeholder="Ex: SAXOFONE"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono focus:outline-none focus:border-rede-roxa"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Identificador único (gerado automaticamente a partir do nome)</p>
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
                disabled={loading || !nome.trim() || !codigo.trim()}
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
