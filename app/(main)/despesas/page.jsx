// Em app/(main)/despesas/page.jsx

"use client";

import { useState, useEffect, useMemo } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FaTrash, FaPencilAlt, FaBoxOpen, FaFileCsv } from 'react-icons/fa';
import CurrencyInput from 'react-currency-input-field';
import EmptyState from '@/components/EmptyState';
import AccountSelector from '@/components/AccountSelector';
import AccountChip from '@/components/AccountChip';
import { CSVLink } from 'react-csv';

export default function DespesasPage() {
  // --- Estados do Formulário ---
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('contas_casa');
  const [type, setType] = useState('pontual');
  const [installments, setInstallments] = useState(1);
  const [accountId, setAccountId] = useState('');

  // --- Estados da UI e Dados ---
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null); // Controla o modo de edição

  const uniqueDescriptions = useMemo(() => {
    const descriptions = expenses.map(exp => {
      // Se for parcela, remove o " (X/Y)" do final para ter a descrição original
      if (exp.isInstallment) {
        return exp.description.substring(0, exp.description.lastIndexOf(' ('));
      }
      return exp.description;
    });
    return [...new Set(descriptions)]; // Retorna apenas as descrições únicas
  }, [expenses]);

  const fetchExpenses = async (date) => {
    setIsLoading(true);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    try {
      const res = await fetch(`/api/despesas?month=${month}&year=${year}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao buscar despesas');
      setExpenses(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses(currentMonth);
  }, [currentMonth]);

  const handleStartEdit = (expense) => {
    setEditingId(expense._id);
    if (expense.isInstallment) {
      const originalDescription = expense.description.substring(0, expense.description.lastIndexOf(' ('));
      setDescription(originalDescription);
      setTotalAmount(expense.installmentDetails.totalAmount);
      setInstallments(expense.installmentDetails.totalInstallments);
    } else {
      setDescription(expense.description);
      setTotalAmount(expense.amount);
      setInstallments(1);
    }
    setPaymentDate(format(new Date(expense.paymentDate), 'yyyy-MM-dd'));
    setCategory(expense.category);
    setType(expense.type);
    setAccountId(expense.accountId?._id || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleCancelEdit = () => {
    setEditingId(null);
    setDescription('');
    setTotalAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setCategory('contas_casa');
    setType('pontual');
    setInstallments(1);
    setAccountId('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const body = {
      description,
      accountId: accountId || undefined,
      totalAmount: parseFloat(totalAmount),
      paymentDate,
      category,
      type,
      installments: parseInt(installments),
    };
    try {
      const url = editingId ? `/api/despesas?id=${editingId}` : '/api/despesas';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Falha na operação');
      handleCancelEdit();
      fetchExpenses(currentMonth);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (expenseId) => {
    const confirmationMessage = "Você tem certeza?\n\nSe esta despesa for uma parcela, TODAS as parcelas da compra serão excluídas.";
    if (!window.confirm(confirmationMessage)) {
      return;
    }
    try {
      const res = await fetch(`/api/despesas?id=${expenseId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Falha ao excluir a despesa');
      }
      fetchExpenses(currentMonth); // Re-busca as despesas para atualizar a view
    } catch (err) {
      setError(err.message);
    }
  };

  const changeMonth = (amount) => {
    setCurrentMonth(current => amount > 0 ? addMonths(current, 1) : subMonths(current, 1));
  };

  const getCsvData = () => {
    const headers = [
      { label: "Descrição", key: "description" },
      { label: "Valor", key: "amount" },
      { label: "Categoria", key: "category" },
      { label: "Data de Vencimento", key: "paymentDate" },
      { label: "Conta", key: "accountName" }
    ];

    const data = expenses.map(expense => ({
      description: expense.description,
      amount: expense.amount,
      category: categories[expense.category] || expense.category,
      paymentDate: format(new Date(expense.paymentDate), 'dd/MM/yyyy'),
      accountName: expense.accountId ? expense.accountId.name : 'N/A' // Adiciona o nome da conta
    }));

    return { data, headers };
  };

  const categories = {
    compras_internet: 'Compras (Internet)',
    mercado: 'Mercado',
    assinaturas: 'Assinaturas',
    dividas: 'Dívidas',
    contas_casa: 'Contas da Casa',
    medico_saude: 'Médico/Saúde',
    entretenimento: 'Entretenimento',
    outros: 'Outros',
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Gerenciar Despesas</h1>

      <div className="p-6 mt-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
          {editingId ? 'Editar Despesa' : 'Adicionar Nova Despesa'}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
                    <input 
                      type="text" 
                      id="description" 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)} 
                      required 
                      className="w-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
                      list="description-suggestions-expenses"
                    />
                    <datalist id="description-suggestions-expenses">
                        {uniqueDescriptions.map((desc, index) => (
                            <option key={index} value={desc} />
                        ))}
                    </datalist>
                </div>
                <div>
                    <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor Total (R$)</label>
                    <CurrencyInput
                      id="totalAmount"
                      name="totalAmount"
                      placeholder="R$ 0,00"
                      value={totalAmount}
                      onValueChange={(value) => setTotalAmount(value || '')}
                      intlConfig={{ locale: 'pt-BR', currency: 'BRL' }}
                      allowDecimals
                      decimalScale={2}
                      className="w-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <div>
                    <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data da Compra / 1º Vencimento</label>
                    <input type="date" id="paymentDate" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required className="w-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoria</label>
                    <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500">
                        {Object.entries(categories).map(([key, value]) => (<option key={key} value={key}>{value}</option>))}
                    </select>
                </div>
                <div>
                    <label htmlFor="installments" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nº de Parcelas</label>
                    <input type="number" id="installments" value={installments} onChange={(e) => setInstallments(e.target.value)} required min="1" className="w-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div className="md:col-span-1">
                    <AccountSelector selectedAccountId={accountId} onChange={setAccountId} />
                </div>
            </div>
            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
            <div className="flex justify-end pt-2 space-x-2">
                {editingId && (<button type="button" onClick={handleCancelEdit} className="px-4 py-2 font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600">Cancelar</button>)}
                <button type="submit" className="px-6 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">{editingId ? 'Salvar Alterações' : 'Adicionar Despesa'}</button>
            </div>
        </form>
      </div>
      
      <div className="mt-8">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Despesas de {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</h2>
            <div className="flex items-center space-x-2">
                {expenses.length > 0 && (
                  <CSVLink
                    data={getCsvData().data}
                    headers={getCsvData().headers}
                    filename={`despesas-${format(currentMonth, 'MMMM-yyyy', { locale: ptBR })}.csv`}
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
          {isLoading ? (
            <p className="text-center text-gray-500 dark:text-gray-400">Carregando despesas...</p>
          ) : expenses.length > 0 ? (
            <div className="overflow-x-auto bg-white rounded-lg shadow dark:bg-gray-800">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Descrição</th>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Valor</th>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Categoria</th>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Conta</th>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">Data Venc.</th>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase dark:text-gray-400">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                        {expenses.map(expense => (
                            <tr key={expense._id}>
                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">{expense.description}</td>
                                <td className="px-6 py-4 text-sm font-medium text-red-600 dark:text-red-400 whitespace-nowrap">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expense.amount)}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{categories[expense.category] || expense.category}</td>
                                <td className="px-6 py-4 text-sm whitespace-nowrap">
                                  {expense.accountId ? (
                                    <div className="w-24">
                                      <AccountChip name={expense.accountId.name} color={expense.accountId.color} />
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{format(new Date(expense.paymentDate), 'dd/MM/yyyy')}</td>
                                <td className="px-6 py-4 text-sm text-right whitespace-nowrap">
                                  <button onClick={() => handleStartEdit(expense)} className="p-2 mr-2 text-gray-500 rounded-full dark:text-gray-400 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-gray-700 dark:hover:text-blue-400" title="Editar despesa"><FaPencilAlt /></button>
                                  <button onClick={() => handleDelete(expense._id)} className="p-2 text-gray-500 rounded-full dark:text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-gray-700 dark:hover:text-red-400" title="Excluir despesa"><FaTrash /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          ) : (
            <EmptyState
              icon={<FaBoxOpen size={32} />}
              title="Nenhuma Despesa Encontrada"
              message="Não há despesas para o mês selecionado. Que tal adicionar uma nova?"
            />
          )}
        </div>
      </div>
    </div>
  );
}
