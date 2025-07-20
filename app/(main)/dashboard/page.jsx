// Em app/(main)/dashboard/page.jsx

"use client";

import { useState, useEffect } from "react";
import ExpensePieChart from "@/components/charts/ExpensePieChart";
import SummaryBarChart from "@/components/charts/SummaryBarChart";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import AccountChip from "@/components/AccountChip";

// Função para formatar valores como moeda brasileira
const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );

export default function DashboardPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSummary = async () => {
      setIsLoading(true);
      const month = currentMonth.getMonth() + 1;
      const year = currentMonth.getFullYear();

      try {
        const res = await fetch(
          `/api/dashboard/summary?month=${month}&year=${year}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Falha ao buscar resumo");
        setSummary(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [currentMonth]);

  const changeMonth = (amount) => {
    setCurrentMonth((current) =>
      amount > 0 ? addMonths(current, 1) : subMonths(current, 1)
    );
  };

  if (isLoading) {
    return <p>Carregando dashboard...</p>;
  }

  if (error) {
    return <p className="text-red-500">Erro: {error}</p>;
  }

  if (!summary) {
    return <p>Não foi possível carregar os dados do resumo.</p>;
  }

  return (
    <div>
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Painel de Controle
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Resumo de {format(currentMonth, "MMMM, yyyy", { locale: ptBR })}
          </p>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-3 py-1 text-sm font-semibold text-indigo-600 bg-indigo-100 border border-indigo-200 rounded-md shadow-sm hover:bg-indigo-200 dark:bg-gray-700 dark:text-indigo-300 dark:border-indigo-900 dark:hover:bg-gray-600"
          >
            Mês Atual
          </button>
          <button
            onClick={() => changeMonth(-1)}
            className="px-3 py-1 text-sm text-gray-600 bg-white border rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Anterior
          </button>
          <button
            onClick={() => changeMonth(1)}
            className="px-3 py-1 text-sm text-gray-600 bg-white border rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Próximo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mt-8 md:grid-cols-3">
        <div className="p-6 bg-green-100 rounded-lg shadow dark:bg-gray-800">
          <h3 className="font-semibold text-green-800 dark:text-green-300">
            Total de Rendas
          </h3>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
            {formatCurrency(summary.totalIncome)}
          </p>
        </div>
        <div className="p-6 bg-red-100 rounded-lg shadow dark:bg-gray-800">
          <h3 className="font-semibold text-red-800 dark:text-red-300">
            Total de Despesas
          </h3>
          <p className="text-2xl font-bold text-red-900 dark:text-red-100">
            {formatCurrency(summary.totalExpenses)}
          </p>
        </div>
        <div
          className={`p-6 rounded-lg shadow ${
            summary.balance >= 0 ? "bg-blue-100" : "bg-yellow-100"
          } dark:bg-gray-800`}
        >
          <h3
            className={`font-semibold ${
              summary.balance >= 0
                ? "text-blue-800 dark:text-blue-300"
                : "text-yellow-800 dark:text-yellow-300"
            }`}
          >
            Saldo do Mês
          </h3>
          <p
            className={`text-2xl font-bold ${
              summary.balance >= 0
                ? "text-blue-900 dark:text-blue-100"
                : "text-yellow-900 dark:text-yellow-100"
            }`}
          >
            {formatCurrency(summary.balance)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 mt-8 lg:grid-cols-5">
        <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800 lg:col-span-2">
          <h3 className="mb-4 font-semibold text-gray-700 dark:text-gray-200">
            Despesas por Categoria
          </h3>
          <div className="h-80">
            <ExpensePieChart expensesData={summary.expensesByCategory} />
          </div>
        </div>
        <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800 lg:col-span-3">
          <h3 className="mb-4 font-semibold text-gray-700 dark:text-gray-200">
            Rendas vs. Despesas
          </h3>
          <div className="h-80">
            <SummaryBarChart
              income={summary.totalIncome}
              expenses={summary.totalExpenses}
            />
          </div>
        </div>
        <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800 lg:col-span-5">
          <h3 className="mb-4 font-semibold text-gray-700 dark:text-gray-200">
            Maiores Despesas do Mês
          </h3>
          {summary.topExpenses && summary.topExpenses.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {summary.topExpenses.map((expense) => (
                <li
                  key={expense._id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-800 dark:text-gray-100">
                      {expense.description}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(expense.paymentDate).toLocaleDateString(
                        "pt-BR",
                        { day: "2-digit", month: "short" }
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    {expense.accountId && (
                      <div className="hidden w-24 sm:block">
                        <AccountChip
                          name={expense.accountId.name}
                          color={expense.accountId.color}
                          small
                        />
                      </div>
                    )}
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(expense.amount)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-center text-gray-500 dark:text-gray-400">
              Não há despesas registradas neste mês para criar um ranking.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
