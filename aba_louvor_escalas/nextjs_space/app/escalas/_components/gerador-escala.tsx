'use client';

import { useState } from 'react';
import { Calendar, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

type GeradorEscalaProps = {
  onGerar: (mes: string, ano: string) => void;
  loading: boolean;
};

export function GeradorEscala({ onGerar, loading }: GeradorEscalaProps) {
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;

  const [mes, setMes] = useState(String(mesAtual).padStart(2, '0'));
  const [ano, setAno] = useState(String(anoAtual));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGerar(mes, ano);
  };

  const meses = [
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ];

  const anos = [];
  for (let i = anoAtual - 1; i <= anoAtual + 2; i++) {
    anos.push(i);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-8 border border-gray-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-r from-rede-roxa to-rede-amarela rounded-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Gerar Escala Automática</h2>
            <p className="text-sm text-gray-400">Selecione o mês e ano para gerar a escala</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mês *
              </label>
              <select
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-rede-roxa"
                required
              >
                {meses.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ano *
              </label>
              <select
                value={ano}
                onChange={(e) => setAno(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-rede-roxa"
                required
              >
                {anos.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <h3 className="font-semibold mb-2 text-rede-amarela flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              O algoritmo vai:
            </h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Distribuir voluntários de <strong>redes diferentes</strong> da rede responsável</li>
              <li>• Equilibrar níveis (<strong>experiente, médio, novo</strong>)</li>
              <li>• Evitar escalar a mesma pessoa em <strong>dias consecutivos</strong></li>
              <li>• Respeitar <strong>ausências</strong> cadastradas</li>
              <li>• Escalar <strong>1 ministro</strong> e <strong>3 back vocals</strong> por culto</li>
              <li>• Marcar com <strong>*</strong> quem é <strong>Diretor Musical</strong></li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-rede-roxa to-rede-amarela text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                Carregando...
              </>
            ) : (
              <>
                <Calendar className="h-5 w-5" />
                Configurar e Gerar Escala
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
