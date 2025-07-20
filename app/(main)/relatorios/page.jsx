// Em app/(main)/relatorios/page.jsx

"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import AnnualSummaryChart from '@/components/charts/AnnualSummaryChart';
import AccountChip from '@/components/AccountChip'; // Importar o AccountChip
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useTheme } from 'next-themes';
import { FaFilePdf } from 'react-icons/fa';  

const formatCurrency = (value) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

export default function RelatoriosPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef(null);
  const { resolvedTheme } = useTheme();

  // Busca os anos disponíveis uma vez quando a página carrega
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await fetch('/api/reports/annual?getYears=true');
        const data = await res.json();
        if (!res.ok) throw new Error('Falha ao buscar anos');
        setAvailableYears(data.data.length > 0 ? data.data : [new Date().getFullYear()]);
      } catch (err) {
        setAvailableYears([new Date().getFullYear()]); // Fallback
      }
    };
    fetchYears();
  }, []);

  // Busca o relatório sempre que o ano mudar
  useEffect(() => {
    if (availableYears.length === 0) return; // Não busca antes de ter os anos
    const fetchReport = async () => {
      setIsLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/reports/annual?year=${year}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Falha ao buscar relatório');
        setReportData(data.data);
      } catch (err) {
        setError(err.message);
        setReportData(null); // Limpa dados antigos em caso de erro
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [year, availableYears]);

  const sortedExpensesByAccount = useMemo(() => {
    if (!reportData?.expensesByAccount) {
      return [];
    }
    // Cria uma cópia para não modificar o estado original
    return [...reportData.expensesByAccount].sort((a, b) => {
      // Regra 1: Se 'a' não tem conta (_id é null), ele deve ir para o final.
      if (a._id === null) return 1;
      // Regra 2: Se 'b' não tem conta (_id é null), ele deve ir para o final.
      if (b._id === null) return -1;
      // Regra 3: Se ambos têm conta, ordena pelo maior valor.
      return b.total - a.total;
    });
  }, [reportData]);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // Aumenta a resolução da imagem
        useCORS: true,
        backgroundColor: resolvedTheme === 'dark' ? '#111827' : '#ffffff', // Define o fundo
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Configurações do PDF (A4 paisagem para caber melhor)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;

      const imgWidth = pdfWidth - 20; // Largura com margens de 10mm
      const imgHeight = imgWidth / ratio;
      
      let heightLeft = imgHeight;
      let position = 10; // Margem superior

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > -10) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      pdf.save(`relatorio-anual-${year}.pdf`);

    } catch (err) {
      console.error("Erro ao exportar PDF:", err);
      alert("Ocorreu um erro ao gerar o PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100"></h1>
        <div className="flex items-center gap-4">
          <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="input-form">
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
           <button onClick={handleExportPDF} disabled={isLoading || isExporting || !reportData} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
            <FaFilePdf className="mr-2" />
            {isExporting ? 'Exportando...' : 'Exportar PDF'}
          </button>
        </div>
      </div>

      {isLoading ? <p className="mt-8 text-center">Gerando relatório...</p> :
       error ? <p className="mt-8 text-center text-red-500">{error}</p> :
       reportData && (
        <div ref={reportRef} className="p-4 bg-gray-50 dark:bg-gray-900">
          {/* Adicionamos um título dentro da área de exportação para aparecer no PDF */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Relatório Financeiro Anual</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">Resumo do Ano de {year}</p>
          </div>

          {/* Cards de Resumo Anual */}
          <div className="grid grid-cols-1 gap-6 mt-4 md:grid-cols-3">
            <div className="p-6 bg-green-100 rounded-lg shadow dark:bg-gray-800">
              <h3 className="font-semibold text-green-800 dark:text-green-300">Total de Rendas no Ano</h3>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{formatCurrency(reportData.totalAnnualIncome)}</p>
            </div>
            <div className="p-6 bg-red-100 rounded-lg shadow dark:bg-gray-800">
              <h3 className="font-semibold text-red-800 dark:text-red-300">Total de Despesas no Ano</h3>
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">{formatCurrency(reportData.totalAnnualExpense)}</p>
            </div>
            <div className={`p-6 rounded-lg shadow ${reportData.annualBalance >= 0 ? 'bg-blue-100' : 'bg-yellow-100'} dark:bg-gray-800`}>
              <h3 className={`font-semibold ${reportData.annualBalance >= 0 ? 'text-blue-800 dark:text-blue-300' : 'text-yellow-800 dark:text-yellow-300'}`}>Saldo Final do Ano</h3>
              <p className={`text-2xl font-bold ${reportData.annualBalance >= 0 ? 'text-blue-900 dark:text-blue-100' : 'text-yellow-900 dark:text-yellow-100'}`}>{formatCurrency(reportData.annualBalance)}</p>
            </div>
          </div>

          {/* Gráfico Anual */}
          <div className="p-6 mt-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-semibold text-gray-700 dark:text-gray-200">Rendas vs. Despesas Mensais</h2>
            <div className="h-96">
              <AnnualSummaryChart reportData={reportData.monthlyData} />
            </div>
          </div>

          {/* Resumo de Despesas por Conta */}
          <div className="p-6 mt-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-semibold text-gray-700 dark:text-gray-200">Despesas por Conta/Cartão</h2>
            {reportData.expensesByAccount.length > 0 ? (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {sortedExpensesByAccount.map(item => (
                    <li key={item._id || 'unlinked'} className="flex items-center justify-between py-3">
                    {item._id ? (
                        <div className="w-28"><AccountChip name={item.accountDetails[0]?.name} color={item.accountDetails[0]?.color} /></div>
                    ) : (
                        <span className="font-medium text-gray-600 dark:text-gray-300">Boleto/Pix</span>
                    )}
                    <span className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(item.total)}</span>
                    </li>
                ))}
                </ul>
            ) : (
                <p className="text-sm text-center text-gray-500 dark:text-gray-400">Nenhuma despesa registrada neste ano.</p>
            )}
          </div>

          {/* Lista de Todas as Rendas do Ano */}
          <div className="p-6 mt-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-semibold text-gray-700 dark:text-gray-200">Detalhamento de Rendas no Ano</h2>
            {reportData.detailedIncomeEvents && reportData.detailedIncomeEvents.length > 0 ? (
                <div className="overflow-x-auto max-h-96">
                <table className="min-w-full text-sm">
                    <thead className="text-left text-gray-500 dark:text-gray-400">
                    <tr>
                        <th className="sticky top-0 p-2 bg-gray-50 dark:bg-gray-700">Data</th>
                        <th className="sticky top-0 p-2 bg-gray-50 dark:bg-gray-700">Descrição</th>
                        <th className="sticky top-0 p-2 text-right bg-gray-50 dark:bg-gray-700">Valor</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {reportData.detailedIncomeEvents.map(income => (
                        <tr key={income._id}>
                        <td className="p-2 whitespace-nowrap">{format(new Date(income.date), 'dd/MM/yyyy')}</td>
                        <td className="p-2">{income.description}</td>
                        <td className="p-2 text-right font-medium text-green-600 dark:text-green-400">{formatCurrency(income.amount)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            ) : (
                <p className="text-sm text-center text-gray-500 dark:text-gray-400">Nenhuma renda registrada neste ano.</p>
            )}
          </div>
        </div>
       )}
    </div>
  );
}
