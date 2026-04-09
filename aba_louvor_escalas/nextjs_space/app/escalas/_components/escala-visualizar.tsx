'use client';

import { useState, useMemo } from 'react';
import { Edit, FileText, FileSpreadsheet } from 'lucide-react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

type Slot = { codigo: string; qtd: number };
type ExpandedEntry = { funcao: string; codigo: string; label: string };

type EscalaVisualizarProps = {
  escala: any;
  mes: string;
};

const redeBgColors: Record<string, string> = {
  BRANCA: 'bg-white text-black',
  AMARELA: 'bg-yellow-500 text-black',
  LARANJA: 'bg-orange-500 text-white',
  ROXA: 'bg-purple-700 text-white'
};

const redeHeaderColors: Record<string, string> = {
  BRANCA: 'bg-gray-200 text-black',
  AMARELA: 'bg-yellow-400 text-black',
  LARANJA: 'bg-orange-400 text-white',
  ROXA: 'bg-purple-600 text-white'
};

const redePdfColors: Record<string, [number, number, number]> = {
  BRANCA: [220, 220, 220],
  AMARELA: [255, 215, 0],
  LARANJA: [255, 140, 0],
  ROXA: [128, 0, 128]
};

const redePdfHeaderColors: Record<string, [number, number, number]> = {
  BRANCA: [200, 200, 200],
  AMARELA: [240, 200, 0],
  LARANJA: [230, 120, 0],
  ROXA: [100, 0, 140]
};

// Extrai o codigo do instrumento a partir de funcao (ex: BATERIA_1 -> BATERIA, BACK_VOCAL_3 -> BACK_VOCAL)
function extractCodigo(funcao: string): string {
  const parts = funcao.split('_');
  const last = parts[parts.length - 1];
  if (/^\d+$/.test(last)) parts.pop();
  return parts.join('_');
}

function isMinistroCode(codigo: string) { return codigo === 'MINISTRO'; }
function isBackVocalCode(codigo: string) { return codigo === 'BACK_VOCAL'; }
function isTecnicoCode(codigo: string) { return codigo.startsWith('TECNICO'); }

function getVolByFuncao(culto: any, funcao: string): any {
  return culto?.voluntarios?.find((v: any) => v.funcao === funcao) ?? null;
}

function getNome(culto: any, funcao: string): string {
  const vol = getVolByFuncao(culto, funcao);
  if (!vol?.voluntario) return '-';
  const nome = vol.voluntario.nome;
  return vol.voluntario.diretorCulto ? `${nome} *` : nome;
}

function getNomeLimpo(culto: any, funcao: string): string {
  const vol = getVolByFuncao(culto, funcao);
  return vol?.voluntario?.nome ?? '-';
}

function isDiretor(culto: any, funcao: string): boolean {
  const vol = getVolByFuncao(culto, funcao);
  return vol?.voluntario?.diretorCulto === true;
}

function temDiretorNoCulto(culto: any): boolean {
  return culto?.voluntarios?.some((v: any) => v.voluntario?.diretorCulto === true) ?? false;
}

function formatDiaSemana(dateStr: string): string {
  const date = new Date(dateStr);
  const dias = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const dia = dias[date.getUTCDay()];
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${dia}, ${dd}/${mm}`;
}

// Expande os slots de um culto em entradas individuais categorizadas
function expandSlotsForCulto(slots: Slot[], configMap: Map<string, string>) {
  const instrumentos: ExpandedEntry[] = [];
  const ministros: ExpandedEntry[] = [];
  const vocals: ExpandedEntry[] = [];
  const tecnicos: ExpandedEntry[] = [];

  for (const slot of slots) {
    const label = configMap.get(slot.codigo) || slot.codigo.replace(/_/g, ' ');
    for (let i = 1; i <= slot.qtd; i++) {
      const funcao = `${slot.codigo}_${i}`;
      const entry: ExpandedEntry = { funcao, codigo: slot.codigo, label };
      if (isMinistroCode(slot.codigo)) ministros.push(entry);
      else if (isBackVocalCode(slot.codigo)) vocals.push(entry);
      else if (isTecnicoCode(slot.codigo)) tecnicos.push(entry);
      else instrumentos.push(entry);
    }
  }
  return { instrumentos, ministros, vocals, tecnicos };
}

// Constroi linhas dinamicas para um culto
function buildRowsForCulto(culto: any, configMap: Map<string, string>) {
  const slots: Slot[] = culto.slots || [];
  const { instrumentos, ministros, vocals, tecnicos } = expandSlotsForCulto(slots, configMap);
  const numRows = Math.max(instrumentos.length, ministros.length, vocals.length, tecnicos.length, 1);

  const rows = [];
  for (let i = 0; i < numRows; i++) {
    rows.push({
      inst: instrumentos[i] || null,
      ministro: ministros[i] || null,
      vocal: vocals[i] || null,
      tecnico: tecnicos[i] || null,
    });
  }
  return rows;
}

// Label curta para técnicos
function getTecnicoShortLabel(codigo: string, configMap: Map<string, string>): string {
  const nome = configMap.get(codigo);
  if (nome) {
    // "Técnico de Som" -> "Som", "Técnico de Transmissão" -> "Transmissão"
    const short = nome.replace(/^T[eé]c(nico)?[\s.]*(de\s+)?/i, '');
    return short || nome;
  }
  return codigo.replace('TECNICO_', '').replace(/_/g, ' ');
}

export function EscalaVisualizar({ escala, mes }: EscalaVisualizarProps) {
  const [editMode, setEditMode] = useState<string | null>(null);
  const [escalaData, setEscalaData] = useState(escala);
  const [exporting, setExporting] = useState(false);

  // Mapa de codigo -> nome legível
  const configMap = useMemo(() => {
    const map = new Map<string, string>();
    map.set('MINISTRO', 'Ministro');
    escalaData?.instrumentoConfigs?.forEach((ic: any) => {
      map.set(ic.codigo, ic.nome);
    });
    return map;
  }, [escalaData?.instrumentoConfigs]);

  const handleSalvarEdicao = async (cultoId: string, funcao: string, novoVoluntarioId: string) => {
    try {
      const response = await fetch('/api/escalas/editar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escalaId: escalaData.id,
          cultoId,
          funcao,
          voluntarioId: novoVoluntarioId
        })
      });
      if (response.ok) {
        const updated = await response.json();
        setEscalaData(updated);
        setEditMode(null);
      } else {
        alert('Erro ao salvar edição');
      }
    } catch (error) {
      alert('Erro ao salvar edição');
    }
  };

  const renderEditSelect = (cultoId: string, funcao: string, currentVolId: string) => {
    const codigo = extractCodigo(funcao);
    const isMinistro = isMinistroCode(codigo);
    return (
      <div className="flex items-center gap-1">
        <select
          defaultValue={currentVolId}
          onChange={(e) => handleSalvarEdicao(cultoId, funcao, e.target.value)}
          className="w-full px-1 py-0.5 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-purple-500"
        >
          <option value="">Selecionar...</option>
          {escalaData?.voluntariosDisponiveis
            ?.filter((v: any) => {
              if (isMinistro) return v.ministro;
              return v.instrumentos?.includes(codigo);
            })
            ?.map((v: any) => (
              <option key={v.id} value={v.id}>{v.nome}{v.diretorCulto ? ' *' : ''}</option>
            ))}
        </select>
        <button onClick={() => setEditMode(null)} className="text-red-400 text-xs hover:text-red-300">✕</button>
      </div>
    );
  };

  const renderCell = (cultoId: string, funcao: string, nome: string) => {
    const editKey = `${cultoId}-${funcao}`;
    const isEditing = editMode === editKey;
    const vol = escalaData?.cultos?.find((c: any) => c.id === cultoId)?.voluntarios?.find((v: any) => v.funcao === funcao);
    if (isEditing) return renderEditSelect(cultoId, funcao, vol?.voluntarioId ?? '');
    return (
      <div className="flex items-center justify-between group cursor-pointer hover:bg-gray-700/30 px-1 rounded" onClick={() => setEditMode(editKey)}>
        <span className="text-sm text-white">{nome}</span>
        <Edit className="h-3 w-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    );
  };

  // ===== EXCEL =====
  const handleExportarExcel = () => {
    setExporting(true);
    try {
      const workbook = XLSX.utils.book_new();
      const wsData: any[][] = [];

      escalaData?.cultos?.forEach((culto: any, idx: number) => {
        if (idx > 0) wsData.push([]);
        const diaFormatado = formatDiaSemana(culto.data);
        const rede = culto.redeResponsavel;
        const tipoLabel = culto.especial ? 'ESPECIAL' : 'CELEBRAÇÃO';

        const d = (funcao: string) => {
          const nome = getNomeLimpo(culto, funcao);
          return isDiretor(culto, funcao) ? `${nome} *` : nome;
        };

        const rows = buildRowsForCulto(culto, configMap);

        // Header
        wsData.push([rede, 'Instrumento', tipoLabel, 'Ministro', 'Vocal', 'Técnico']);

        // Sub-header com data
        wsData.push(['', diaFormatado, '', '', '', '']);

        rows.forEach(row => {
          const instLabel = row.inst ? row.inst.label : '';
          const instNome = row.inst ? d(row.inst.funcao) : '';
          const ministroNome = row.ministro ? d(row.ministro.funcao) : '';
          const vocalNome = row.vocal ? d(row.vocal.funcao) : '';
          let tecVal = '';
          if (row.tecnico) {
            const shortLabel = getTecnicoShortLabel(row.tecnico.codigo, configMap);
            const nome = d(row.tecnico.funcao);
            tecVal = `${shortLabel}: ${nome}`;
          }
          wsData.push(['', instLabel, instNome, ministroNome, vocalNome, tecVal]);
        });

        if (temDiretorNoCulto(culto)) {
          wsData.push(['', '', '* Direção Musical', '', '', '']);
        }
      });

      const worksheet = XLSX.utils.aoa_to_sheet(wsData);
      worksheet['!cols'] = [
        { wch: 12 }, { wch: 18 }, { wch: 22 }, { wch: 22 }, { wch: 18 }, { wch: 28 }
      ];
      const [ano, mesNum] = mes.split('-');
      const mesNome = new Date(parseInt(ano), parseInt(mesNum) - 1).toLocaleDateString('pt-BR', { month: 'long' });
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Escala');
      XLSX.writeFile(workbook, `Escala_${mesNome}_${ano}.xlsx`);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('Erro ao exportar Excel');
    } finally {
      setExporting(false);
    }
  };

  // ===== PDF =====
  const handleExportarPDF = () => {
    setExporting(true);
    try {
      const doc = new jsPDF({ orientation: 'landscape' });
      const [ano, mesNum] = mes.split('-');
      const mesNome = new Date(parseInt(ano), parseInt(mesNum) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`Aba Louvor - Escala ${mesNome}`, 14, 15);
      let yPosition = 25;

      escalaData?.cultos?.forEach((culto: any) => {
        if (yPosition > 160) { doc.addPage(); yPosition = 15; }
        const diaFormatado = formatDiaSemana(culto.data);
        const rede = culto.redeResponsavel;
        const tipoLabel = culto.especial ? 'ESPECIAL' : 'CELEBRAÇÃO';
        const redeColor = redePdfColors[rede] ?? [128, 128, 128];
        const redeHeaderColor = redePdfHeaderColors[rede] ?? [100, 100, 100];
        const isLightRede = rede === 'BRANCA' || rede === 'AMARELA';
        const headTextColor: [number, number, number] = isLightRede ? [0, 0, 0] : [255, 255, 255];

        const d = (funcao: string) => {
          const nome = getNomeLimpo(culto, funcao);
          return isDiretor(culto, funcao) ? `${nome} *` : nome;
        };

        const rows = buildRowsForCulto(culto, configMap);

        const tableHead = [[rede, 'Instrumento', tipoLabel, 'Ministro', 'Vocal', 'Técnico']];
        const tableBody: string[][] = [];

        // Sub-header com data
        tableBody.push(['', diaFormatado, '', '', '', '']);

        rows.forEach(row => {
          const instLabel = row.inst ? row.inst.label : '';
          const instNome = row.inst ? d(row.inst.funcao) : '';
          const ministroNome = row.ministro ? d(row.ministro.funcao) : '';
          const vocalNome = row.vocal ? d(row.vocal.funcao) : '';
          let tecVal = '';
          if (row.tecnico) {
            const shortLabel = getTecnicoShortLabel(row.tecnico.codigo, configMap);
            const nome = d(row.tecnico.funcao);
            tecVal = `${shortLabel}: ${nome}`;
          }
          tableBody.push(['', instLabel, instNome, ministroNome, vocalNome, tecVal]);
        });

        autoTable(doc, {
          startY: yPosition,
          head: tableHead,
          body: tableBody,
          theme: 'grid',
          styles: { fontSize: 9, cellPadding: 3, lineColor: [80, 80, 80], lineWidth: 0.3 },
          headStyles: { fillColor: redeHeaderColor, textColor: headTextColor, fontStyle: 'bold', halign: 'center', fontSize: 10 },
          bodyStyles: { fillColor: [30, 30, 30], textColor: [220, 220, 220] },
          columnStyles: {
            0: { cellWidth: 18, fillColor: redeColor, textColor: headTextColor, fontStyle: 'bold', halign: 'center' },
            1: { cellWidth: 25, fontStyle: 'bold' },
            2: { cellWidth: 38 },
            3: { cellWidth: 38 },
            4: { cellWidth: 35 },
            5: { cellWidth: 38 }
          },
          didParseCell: function(data: any) {
            if (data.section === 'body' && data.column.index === 0 && data.cell.raw === '') {
              data.cell.styles.fillColor = [30, 30, 30];
              data.cell.styles.textColor = [30, 30, 30];
            }
            // Data sub-header row - make it slightly different
            if (data.section === 'body' && data.row.index === 0 && data.column.index === 1) {
              data.cell.styles.fontStyle = 'italic';
              data.cell.styles.textColor = [180, 180, 180];
            }
          }
        });

        yPosition = (doc as any).lastAutoTable.finalY;
        if (temDiretorNoCulto(culto)) {
          doc.setFontSize(7);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(180, 140, 255);
          doc.text('* Direção Musical', 14, yPosition + 4);
          yPosition += 4;
        }
        yPosition += 8;
      });

      doc.save(`Escala_${mesNome.replace(/ /g, '_')}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Erro ao exportar PDF');
    } finally {
      setExporting(false);
    }
  };

  // ===== RENDER =====
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex justify-end gap-3">
        <button onClick={handleExportarExcel} disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-colors disabled:opacity-50">
          <FileSpreadsheet className="h-5 w-5" /> Exportar Excel
        </button>
        <button onClick={handleExportarPDF} disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors disabled:opacity-50">
          <FileText className="h-5 w-5" /> Exportar PDF
        </button>
      </div>

      {escalaData?.cultos?.map((culto: any) => {
        const diaFormatado = formatDiaSemana(culto.data);
        const rede = culto.redeResponsavel;
        const tipoLabel = culto.especial ? 'ESPECIAL' : 'CELEBRAÇÃO';
        const bgRede = redeBgColors[rede] ?? 'bg-gray-600 text-white';
        const headerRede = redeHeaderColors[rede] ?? 'bg-gray-500 text-white';
        const hasDiretor = temDiretorNoCulto(culto);

        const rows = buildRowsForCulto(culto, configMap);
        const numBodyRows = rows.length;

        return (
          <div key={culto.id} className="overflow-x-auto rounded-xl border border-gray-700">
            <table className="w-full border-collapse">
              <tbody>
                {/* Header row */}
                <tr>
                  <td className={`${bgRede} w-14 px-2 py-2 text-center font-bold text-sm border border-gray-600`} rowSpan={numBodyRows + 2}>
                    <span className="block" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)', whiteSpace: 'nowrap' }}>
                      {rede}
                    </span>
                  </td>
                  <td className={`${headerRede} px-3 py-2 text-center text-sm font-bold border border-gray-600`}>
                    Instrumento
                  </td>
                  <td className={`${headerRede} px-3 py-2 text-center text-sm font-bold border border-gray-600 uppercase tracking-wider`}>
                    {tipoLabel}
                  </td>
                  <td className={`${headerRede} px-3 py-2 text-center text-sm font-bold border border-gray-600`}>
                    Ministro
                  </td>
                  <td className={`${headerRede} px-3 py-2 text-center text-sm font-bold border border-gray-600`}>
                    Vocal
                  </td>
                  <td className={`${headerRede} px-3 py-2 text-center text-sm font-bold border border-gray-600`}>
                    Técnico
                  </td>
                </tr>

                {/* Sub-header com data */}
                <tr className="bg-gray-800">
                  <td colSpan={2} className="px-3 py-1.5 text-sm text-gray-300 italic border border-gray-700">
                    {diaFormatado}
                  </td>
                  <td className="border border-gray-700" />
                  <td className="border border-gray-700" />
                  <td className="border border-gray-700" />
                </tr>

                {/* Linhas de dados dinâmicas */}
                {rows.map((row, i) => (
                  <tr key={i} className="bg-gray-900 hover:bg-gray-800/70 transition-colors">
                    {/* Instrumento label */}
                    <td className="px-3 py-2 text-sm font-semibold text-gray-300 border border-gray-700 whitespace-nowrap">
                      {row.inst ? row.inst.label : ''}
                    </td>
                    {/* Celebração - nome do instrumentista */}
                    <td className="px-3 py-2 border border-gray-700">
                      {row.inst ? renderCell(culto.id, row.inst.funcao, getNome(culto, row.inst.funcao)) : null}
                    </td>
                    {/* Ministro */}
                    <td className="px-3 py-2 border border-gray-700">
                      {row.ministro ? renderCell(culto.id, row.ministro.funcao, getNome(culto, row.ministro.funcao)) : null}
                    </td>
                    {/* Vocal */}
                    <td className="px-3 py-2 border border-gray-700">
                      {row.vocal ? renderCell(culto.id, row.vocal.funcao, getNome(culto, row.vocal.funcao)) : null}
                    </td>
                    {/* Técnico */}
                    <td className="px-3 py-2 border border-gray-700">
                      {row.tecnico ? (
                        <div>
                          <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide block leading-tight">
                            {getTecnicoShortLabel(row.tecnico.codigo, configMap)}
                          </span>
                          {renderCell(culto.id, row.tecnico.funcao, getNome(culto, row.tecnico.funcao))}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {hasDiretor && (
              <div className="px-4 py-1.5 bg-gray-900/80 border-t border-gray-800 text-xs text-purple-400 italic">
                * Direção Musical
              </div>
            )}
          </div>
        );
      })}
    </motion.div>
  );
}
