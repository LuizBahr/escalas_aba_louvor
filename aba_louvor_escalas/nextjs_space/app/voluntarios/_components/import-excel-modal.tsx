'use client';

import { useState } from 'react';
import { X, Upload, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

type ImportExcelModalProps = {
  onClose: () => void;
};

export function ImportExcelModal({ onClose }: ImportExcelModalProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/voluntarios/import', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        router.refresh();
        if (data.errors?.length === 0) {
          setTimeout(() => onClose(), 2000);
        }
      } else {
        alert(data.error || 'Erro ao importar arquivo');
      }
    } catch (error) {
      alert('Erro ao importar arquivo');
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
          className="bg-gray-900 rounded-xl shadow-2xl border border-gray-800 w-full max-w-lg"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <h2 className="text-2xl font-bold">Importar Voluntários (Excel)</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 max-h-48 overflow-y-auto">
              <h3 className="font-semibold mb-2 text-rede-amarela">Formato do Excel:</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• <strong>nome</strong>: Nome completo</li>
                <li>• <strong>email</strong>: Email único</li>
                <li>• <strong>dataNascimento</strong>: DD/MM/AAAA (opcional)</li>
                <li>• <strong>rede</strong>: BRANCA, AMARELA, LARANJA, ROXA</li>
                <li>• <strong>qualGC</strong>: Nome do GC (opcional)</li>
                <li>• <strong>discipulador</strong>: Nome do discipulador (opcional)</li>
                <li>• <strong>instrumentos</strong>: BATERIA, BAIXO, GUITARRA, VIOLAO, TECLADO, BACK_VOCAL, TECNICO_SOM, TECNICO_TRANSMISSAO (separados por vírgula)</li>
                <li>• <strong>ministro</strong>: sim ou não</li>
                <li>• <strong>diretorCulto</strong>: sim ou não (Diretor Musical)</li>
                <li>• <strong>nivel</strong>: NOVO, MEDIO, EXPERIENTE</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Arquivo Excel (.xlsx, .xls)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center justify-center gap-2 w-full px-4 py-8 bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg hover:border-rede-roxa cursor-pointer transition-colors"
                >
                  {file ? (
                    <>
                      <FileSpreadsheet className="h-6 w-6 text-rede-amarela" />
                      <span className="text-white">{file.name}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-gray-500" />
                      <span className="text-gray-400">Clique para selecionar arquivo</span>
                    </>
                  )}
                </label>
              </div>
            </div>

            {result && (
              <div className={`p-4 rounded-lg ${
                result.errors?.length === 0
                  ? 'bg-green-500/10 border border-green-500/50'
                  : 'bg-yellow-500/10 border border-yellow-500/50'
              }`}>
                <p className={result.errors?.length === 0 ? 'text-green-400' : 'text-yellow-400'}>
                  {result.success} voluntário(s) importado(s) com sucesso!
                </p>
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-red-400">Erros:</p>
                    <ul className="text-sm text-red-300 mt-1 space-y-1 max-h-32 overflow-y-auto">
                      {result.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Fechar
              </button>
              <button
                type="submit"
                disabled={!file || loading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-rede-roxa to-rede-amarela text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Importando...' : 'Importar'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
