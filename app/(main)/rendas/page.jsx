// Em app/(main)/rendas/page.jsx

"use client";

import { useState, useEffect, useMemo } from 'react';
import { FaTrash, FaPencilAlt, FaPiggyBank, FaFileCsv } from 'react-icons/fa';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CurrencyInput from 'react-currency-input-field';
import EmptyState from '@/components/EmptyState';
import { CSVLink } from 'react-csv';

export default function RendasPage() {
  // --- Estados do formulário ---
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('unica');
  const [endDate, setEndDate] = useState('');

  // --- Estados da UI e dados ---
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [incomes, setIncomes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);

  // --- Funções ---
  const fetchIncomes = async (dateToFetch) => {
    setIsLoading(true);
    setError('');
    const month = dateToFetch.getMonth() + 1;
    const year = dateToFetch.getFullYear();
    try {
      const res = await fetch(`/api/rendas?month=${month}&year=${year}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao buscar rendas');
      setIncomes(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes(currentMonth);
  }, [currentMonth]);

  const uniqueDescriptions = useMemo(() => {
    return [...new Set(incomes.map(inc => inc.description))];
  }, [incomes]);

  const getCsvData = () => {
    const headers = [
      { label: "Descrição", key: "description" },
      { label: "Valor", key: "amount" },
      { label: "Data", key: "date" },
      { label: "Tipo", key: "type" },
      { label: "Data Final (Intervalo)", key: "endDate" }
    ];

    const data = incomes.map(income => ({
      description: income.description,
      amount: income.amount,
      date: new Date(income.date).toLocaleDateString('pt-BR'),
      type: income.type,
      endDate: income.endDate ? new Date(income.endDate).toLocaleDateString('pt-BR') : ''
    }));

    return { data, headers };
  };

  const handleStartEdit = (income) => {
    setEditingId(income._id);
    setDescription(income.description);
    setAmount(income.amount.toString());
    setDate(format(new Date(income.date), 'yyyy-MM-dd'));
    setType(income.type);
    setEndDate(income.endDate ? format(new Date(income.endDate), 'yyyy-MM-dd') : '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDescription('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setType('unica');
    setEndDate('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const requestBody = {
      description,
      amount: parseFloat(amount),
      date,
      type,
      endDate: type === 'intervalo' ? endDate : undefined,
    };
    if (type === 'intervalo' && !endDate) {
        setError('Para o tipo "Intervalo", a Data Final é obrigatória.');
        return;
    }

    try {
      const url = editingId ? `/api/rendas?id=${editingId}` : '/api/rendas';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Falha na operação');

      handleCancelEdit();
      await fetchIncomes(currentMonth); // Re-busca os dados para o mês atual
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (incomeId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta renda?')) return;
    try {
      const res = await fetch(`/api/rendas?id=${incomeId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao excluir a renda');
      await fetchIncomes(currentMonth); // Re-busca os dados para o mês atual
    } catch (err) {
      alert(err.message);
    }
  };

  const changeMonth = (amount) => {
    setCurrentMonth(current => amount > 0 ? addMonths(current, 1) : subMonths(current, 1));
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Gerenciar Rendas</h1>

      <div className="p-6 mt-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
          {editingId ? 'Editar Renda' : 'Adicionar Nova Renda'}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
              <input type="text" id="description" value={description} onChange={(e) => setDescription(e.target.value)} required 
                className="w-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
                list="description-suggestions"
              />
              <datalist id="description-suggestions">
                {uniqueDescriptions.map((desc, index) => (<option key={index} value={desc} />))}
              </datalist>
            </div>
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor (R$)</label>
              <CurrencyInput
                id="amount" name="amount" placeholder="R$ 0,00" value={amount}
                onValueChange={(value) => setAmount(value || '')}
                intlConfig={{ locale: 'pt-BR', currency: 'BRL' }}
                allowDecimals decimalScale={2}
                className="w-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
              <select id="type" value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="unica">Única</option>
                <option value="mensal">Mensal</option>
                <option value="intervalo">Por Intervalo</option>
              </select>
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {type === 'intervalo' ? 'Data de Início' : 'Data'}
              </label>
              <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            {type === 'intervalo' && (
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data Final</label>
                <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} required={type === 'intervalo'} className="w-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            )}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end pt-2 space-x-2">
            {editingId && (
              <button type="button" onClick={handleCancelEdit} className="px-4 py-2 font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600">
                Cancelar
              </button>
            )}
            <button type="submit" className="px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              {editingId ? 'Salvar Alterações' : 'Adicionar Renda'}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Rendas de {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</h2>
          <div className="flex items-center space-x-2">
            {incomes.length > 0 && (
              <CSVLink 
                data={getCsvData().data}
                headers={getCsvData().headers}
                filename={`rendas-${format(currentMonth, 'MMMM-yyyy', { locale: ptBR })}.csv`}
                className="inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                <FaFileCsv className="mr-2" />
                Exportar
              </CSVLink>
            )}
            <button onClick={() => setCurrentMonth(new Date())} className="px-3 py-1 text-sm font-semibold text-indigo-600 bg-indigo-100 border border-indigo-200 rounded-md shadow-sm hover:bg-indigo-200 dark:bg-gray-700 dark:text-indigo-300 dark:border-indigo-900 dark:hover:bg-gray-600">Mês Atual</button>
            <button onClick={() => changeMonth(-1)} className="px-3 py-1 text-sm text-gray-600 bg-white border rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600">Anterior</button>
            <button onClick={() => changeMonth(1)} className="px-3 py-1 text-sm text-gray-600 bg-white border rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600">Próximo</button>
          </div>
        </div>
        
        <div className="mt-4">
          {isLoading ? ( <p className="text-center text-gray-500 dark:text-gray-400">Carregando rendas...</p> ) : 
           incomes.length > 0 ? (
            <div className="overflow-x-auto bg-white rounded-lg shadow dark:bg-gray-800">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Descrição</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Valor</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Data</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Tipo</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase dark:text-gray-400">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {incomes.map(income => (
                    <tr key={income._id}>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">{income.description}</td>
                      <td className="px-6 py-4 text-sm font-medium text-green-600 dark:text-green-400 whitespace-nowrap">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(income.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {income.type === 'intervalo' && income.endDate ? (
                          `${new Date(income.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} - ${new Date(income.endDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`
                        ) : (
                          new Date(income.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{income.type}</td>
                      <td className="px-6 py-4 text-sm text-right whitespace-nowrap">
                        <button onClick={() => handleStartEdit(income)} className="p-2 mr-2 text-gray-500 rounded-full dark:text-gray-400 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-gray-700 dark:hover:text-blue-400" title="Editar renda"><FaPencilAlt /></button>
                        <button onClick={() => handleDelete(income._id)} className="p-2 text-gray-500 rounded-full dark:text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-gray-700 dark:hover:text-red-400" title="Excluir renda"><FaTrash /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={<FaPiggyBank size={32} />}
              title="Nenhuma Renda Encontrada"
              message="Não há rendas para o mês selecionado. Que tal adicionar uma nova?"
            />
          )}
        </div>
      </div>
    </div>
  );
}
