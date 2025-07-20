// Em app/(main)/parcelamentos/page.jsx

"use client";

import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import EmptyState from '@/components/EmptyState';
import AccountChip from '@/components/AccountChip';
import { FaReceipt, FaChevronDown } from 'react-icons/fa';

const formatCurrency = (value) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

export default function ParcelamentosPage() {
  const [allInstallments, setAllInstallments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [openAccordions, setOpenAccordions] = useState({});

  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const fetchAllInstallments = async () => {
      try {
        const res = await fetch('/api/installments/all');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Falha ao buscar dados');
        setAllInstallments(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllInstallments();
  }, []);

  const totalFutureDebt = useMemo(() =>
    allInstallments.reduce((acc, expense) => acc + expense.amount, 0),
  [allInstallments]);

  const monthlySummary = useMemo(() => {
    if (isLoading || allInstallments.length === 0) return [];
    const groupedByMonth = allInstallments.reduce((acc, expense) => {
      const monthYear = format(new Date(expense.paymentDate), 'yyyy-MM');
      if (!acc[monthYear]) {
        acc[monthYear] = 0;
      }
      acc[monthYear] += expense.amount;
      return acc;
    }, {});

    return Object.entries(groupedByMonth)
      .sort(([monthA], [monthB]) => new Date(monthA) - new Date(monthB))
      .map(([monthYear, totalAmount]) => ({ monthYear, totalAmount }));
  }, [allInstallments, isLoading]);

  const groupedByAccount = useMemo(() => {
    if (isLoading || allInstallments.length === 0) return [];
    const grouped = allInstallments.reduce((acc, expense) => {
      if (!expense.accountId) return acc;
      const accountId = expense.accountId._id;
      if (!acc[accountId]) {
        acc[accountId] = { ...expense.accountId, monthlyBreakdown: {} };
      }
      const monthYear = format(new Date(expense.paymentDate), 'yyyy-MM');
      if (!acc[accountId].monthlyBreakdown[monthYear]) {
        acc[accountId].monthlyBreakdown[monthYear] = { total: 0, expenses: [] };
      }
      acc[accountId].monthlyBreakdown[monthYear].total += expense.amount;
      acc[accountId].monthlyBreakdown[monthYear].expenses.push(expense);
      return acc;
    }, {});

    return Object.values(grouped).map(account => ({
      ...account,
      monthlyBreakdown: Object.entries(account.monthlyBreakdown)
        .sort(([monthA], [monthB]) => new Date(monthA) - new Date(monthB))
        .map(([monthYear, data]) => ({ monthYear, ...data }))
    }));
  }, [allInstallments, isLoading]);
  
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Visão de Dívidas Futuras</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">Valores parcelados a vencer nos próximos meses.</p>
      
      {isLoading ? ( <p className="mt-8 text-center">Carregando...</p> ) : 
       error ? ( <p className="mt-8 text-center text-red-500">{error}</p> ) : 
       allInstallments.length > 0 ? (
        <>
          {/* SEÇÃO 1: Card de Total Geral */}
          <div className="p-6 mt-8 text-center bg-white rounded-lg shadow-md dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">Dívida Futura Total</h3>
            <p className="text-4xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(totalFutureDebt)}</p>
          </div>

          {/* SEÇÃO 2: Resumo Mensal Geral */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Resumo Mensal (Geral)</h2>
            <div className="mt-4 overflow-hidden bg-white rounded-lg shadow dark:bg-gray-800">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {monthlySummary.map(item => {
                  const monthDate = new Date(item.monthYear + '-02');
                  return (
                    <li key={item.monthYear} className="flex items-center justify-between px-6 py-4">
                      <span className="text-lg font-medium text-gray-800 capitalize dark:text-gray-200">
                        {format(monthDate, 'MMMM, yyyy', { locale: ptBR })}
                      </span>
                      <span className="text-lg font-semibold text-red-600 dark:text-red-400">
                        {formatCurrency(item.totalAmount)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* SEÇÃO 3: Detalhes por Cartão em formato de Abas */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Detalhes por Cartão/Conta</h2>
            
            <div className="mt-4">
              {/* Navegação das Abas */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex -mb-px space-x-6" aria-label="Tabs">
                  {groupedByAccount.map((account, index) => (
                    <button
                      key={account._id}
                      onClick={() => setActiveTab(index)}
                      className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                        ${activeTab === index 
                          ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'
                        }`
                      }
                    >
                      {account.name}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Conteúdo da Aba Ativa */}
              <div className="py-6">
                {groupedByAccount[activeTab] && (
                  <div className="p-4 bg-white rounded-lg shadow-md dark:bg-gray-800">
                    <div className="flex items-start justify-between gap-4">
                      <div className="w-28 shrink-0">
                        <AccountChip name={groupedByAccount[activeTab].name} color={groupedByAccount[activeTab].color} />
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total a Vencer no Cartão</span>
                        <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                          {formatCurrency(groupedByAccount[activeTab].monthlyBreakdown.reduce((acc, month) => acc + month.total, 0))}
                        </p>
                      </div>
                    </div>
                    
                    <ul className="mt-4 divide-y divide-gray-200 dark:divide-gray-700">
                      {groupedByAccount[activeTab].monthlyBreakdown.map(monthData => {
                        const monthDate = new Date(monthData.monthYear + '-02');
                        return (
                          <li key={monthData.monthYear} className="py-4">
                              <div className="flex items-center justify-between w-full text-left">
                                <span className="font-semibold capitalize text-md dark:text-gray-200">
                                  {format(monthDate, 'MMMM, yyyy', { locale: ptBR })}
                                </span>
                                <span className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(monthData.total)}</span>
                              </div>
                              <div className="pt-2 mt-2 space-y-1 text-sm border-t border-dashed dark:border-gray-600">
                                {monthData.expenses.map(expense => (
                                  <div key={expense._id} className="flex justify-between text-gray-600 dark:text-gray-400">
                                    <span>{expense.description}</span>
                                    <span>{formatCurrency(expense.amount)}</span>
                                  </div>
                                ))}
                              </div>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
       ) : (
        <div className="mt-8">
          <EmptyState
            icon={<FaReceipt size={32} />}
            title="Nenhuma Parcela Futura"
            message="Não há parcelamentos vinculados a cartões ou contas para exibir."
          />
        </div>
       )}
    </div>
  );
}
