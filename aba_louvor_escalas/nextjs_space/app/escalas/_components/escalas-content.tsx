'use client';

import { useState } from 'react';
import { Music, Calendar, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { GeradorEscala } from './gerador-escala';
import { ConfigCultos } from './config-cultos';
import { EscalaVisualizar } from './escala-visualizar';

type Etapa = 'selecao' | 'config' | 'resultado';

export function EscalasContent() {
  const [etapa, setEtapa] = useState<Etapa>('selecao');
  const [mesSelecionado, setMesSelecionado] = useState('');
  const [anoSelecionado, setAnoSelecionado] = useState('');
  const [escalaGerada, setEscalaGerada] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleIrParaConfig = (mes: string, ano: string) => {
    setMesSelecionado(mes);
    setAnoSelecionado(ano);
    setEtapa('config');
  };

  const handleGerarEscala = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/escalas/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mes: parseInt(mesSelecionado), ano: parseInt(anoSelecionado) })
      });

      if (response.ok) {
        const data = await response.json();
        setEscalaGerada(data);
        setEtapa('resultado');
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao gerar escala');
      }
    } catch (error) {
      alert('Erro ao gerar escala');
    } finally {
      setLoading(false);
    }
  };

  const handleVoltar = () => {
    if (etapa === 'resultado') {
      setEscalaGerada(null);
      setEtapa('config');
    } else if (etapa === 'config') {
      setEtapa('selecao');
    }
  };

  const handleVoltarInicio = () => {
    setEscalaGerada(null);
    setEtapa('selecao');
    setMesSelecionado('');
    setAnoSelecionado('');
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
              Gerador de Escalas
            </h1>
            <p className="text-gray-400">Crie escalas inteligentes para os cultos</p>
          </div>
          {etapa !== 'selecao' && (
            <button
              onClick={etapa === 'resultado' ? handleVoltarInicio : handleVoltar}
              className="flex items-center gap-2 px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Voltar
            </button>
          )}
        </div>
      </motion.div>

      {etapa === 'selecao' && (
        <GeradorEscala onGerar={handleIrParaConfig} loading={false} />
      )}

      {etapa === 'config' && (
        <ConfigCultos
          mes={mesSelecionado}
          ano={anoSelecionado}
          onConfirmar={handleGerarEscala}
          onVoltar={handleVoltar}
          loading={loading}
        />
      )}

      {etapa === 'resultado' && escalaGerada && (
        <>
          {escalaGerada.avisos?.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-4 bg-yellow-900/30 border border-yellow-600/40 rounded-xl">
              <h4 className="text-sm font-semibold text-yellow-400 mb-2">⚠️ Avisos da geração:</h4>
              <ul className="space-y-1">
                {escalaGerada.avisos.map((a: string, i: number) => (
                  <li key={i} className="text-xs text-yellow-300/80">• {a}</li>
                ))}
              </ul>
            </motion.div>
          )}
          <EscalaVisualizar escala={escalaGerada} mes={`${anoSelecionado}-${mesSelecionado.padStart(2, '0')}`} />
        </>
      )}
    </div>
  );
}
