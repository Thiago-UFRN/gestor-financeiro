// Em app/(main)/reservas/page.jsx

"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { FaTrash, FaPencilAlt, FaArchive, FaFileCsv } from "react-icons/fa";
import { format } from "date-fns";
import CurrencyInput from "react-currency-input-field";
import EmptyState from "@/components/EmptyState";
import SavingsLineChart from "@/components/charts/SavingsLineChart";
import { CSVLink } from "react-csv";

const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );

export default function ReservasPage() {
  const formRef = useRef(null);

  // Estados do formulário
  const [amount, setAmount] = useState("");
  const [sourceDescription, setSourceDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Estados da UI e dados
  const [savingsList, setSavingsList] = useState([]);
  const [evolutionData, setEvolutionData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formError, setFormError] = useState("");
  const [editingId, setEditingId] = useState(null);

  // Função para buscar todos os dados da página
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [savingsRes, evolutionRes] = await Promise.all([
        fetch("/api/reservas"),
        fetch("/api/reservas/evolution"),
      ]);

      const savingsData = await savingsRes.json();
      if (!savingsRes.ok)
        throw new Error(savingsData.error || "Falha ao buscar reservas");
      setSavingsList(savingsData.data);

      const evolutionJson = await evolutionRes.json();
      if (!evolutionRes.ok)
        throw new Error(evolutionJson.error || "Falha ao buscar evolução");
      setEvolutionData(evolutionJson.data);
    } catch (err) {
      alert(err.message); // Usando alert simples para erros de busca
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const uniqueDescriptions = useMemo(() => {
    return [...new Set(savingsList.map((s) => s.sourceDescription))];
  }, [savingsList]);

  const totalSaved = useMemo(
    () => savingsList.reduce((acc, current) => acc + current.amount, 0),
    [savingsList]
  );

  const handleStartEdit = (saving) => {
    setEditingId(saving._id);
    setAmount(saving.amount);
    setSourceDescription(saving.sourceDescription);
    setDate(format(new Date(saving.date), "yyyy-MM-dd"));
    setFormError("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setAmount("");
    setSourceDescription("");
    setDate(new Date().toISOString().split("T")[0]);
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const body = { amount: parseFloat(amount), sourceDescription, date };

    try {
      const url = editingId ? `/api/reservas?id=${editingId}` : "/api/reservas";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha na operação");

      handleCancelEdit();
      await fetchData(); // Re-busca todos os dados para atualizar a lista e o gráfico
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDelete = async (savingId) => {
    if (!window.confirm("Tem certeza que deseja excluir este registro?"))
      return;
    try {
      const res = await fetch(`/api/reservas?id=${savingId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Falha ao excluir registro");
      await fetchData(); // Re-busca todos os dados para atualizar a lista e o gráfico
    } catch (err) {
      alert(err.message);
    }
  };

  const getCsvData = () => {
    const headers = [
      { label: "Fonte do Dinheiro", key: "sourceDescription" },
      { label: "Valor", key: "amount" },
      { label: "Data", key: "date" },
    ];

    const data = savingsList.map((saving) => ({
      sourceDescription: saving.sourceDescription,
      amount: saving.amount,
      date: new Date(saving.date).toLocaleDateString("pt-BR"),
    }));

    return { data, headers };
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
        Minhas Reservas
      </h1>

      <div className="p-6 mt-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold text-gray-700 dark:text-gray-200">
          Evolução das Reservas
        </h2>
        <div className="h-80">
          {isLoading ? (
            <p className="pt-16 text-center text-gray-500 dark:text-gray-400">
              Carregando gráfico...
            </p>
          ) : (
            <SavingsLineChart evolutionData={evolutionData} />
          )}
        </div>
      </div>

      <div className="p-6 mt-8 text-center bg-white rounded-lg shadow-md dark:bg-gray-800">
        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">
          Total Guardado Atualmente
        </h3>
        <p className="text-4xl font-bold text-teal-600 dark:text-teal-400">
          {formatCurrency(totalSaved)}
        </p>
      </div>

      <div
        ref={formRef}
        className="p-6 mt-8 bg-white rounded-lg shadow-md dark:bg-gray-800"
      >
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
          {editingId ? "Editar Registro da Reserva" : "Adicionar à Reserva"}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Valor (R$)
              </label>
              <CurrencyInput
                id="amount"
                name="amount"
                placeholder="R$ 0,00"
                value={amount}
                onValueChange={(value) => setAmount(value || "")}
                intlConfig={{ locale: "pt-BR", currency: "BRL" }}
                allowDecimals
                decimalScale={2}
                className="w-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Data
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="sourceDescription"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Fonte do Dinheiro (Ex: Sobra do Salário, Venda de Item, 13º)
            </label>
            <input
              type="text"
              id="sourceDescription"
              value={sourceDescription}
              onChange={(e) => setSourceDescription(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 focus:ring-teal-500 focus:border-teal-500"
              list="source-suggestions"
            />
            <datalist id="source-suggestions">
              {uniqueDescriptions.map((desc, index) => (
                <option key={index} value={desc} />
              ))}
            </datalist>
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end pt-2 space-x-2">
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-2 font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              {editingId ? "Salvar Alterações" : "Guardar Dinheiro"}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
            Histórico de Reservas
          </h2>
          {/* <<< MUDANÇA 4: Adicionar o botão de Exportar >>> */}
          {savingsList.length > 0 && (
            <CSVLink
              data={getCsvData().data}
              headers={getCsvData().headers}
              filename={`historico-reservas-${format(
                new Date(),
                "yyyy-MM-dd"
              )}.csv`}
              className="inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              <FaFileCsv className="mr-2" />
              Exportar Histórico
            </CSVLink>
          )}
        </div>
        <div className="mt-4">
          {isLoading ? (
            <p className="text-center text-gray-500 dark:text-gray-400">
              Carregando histórico...
            </p>
          ) : savingsList.length > 0 ? (
            <div className="overflow-x-auto bg-white rounded-lg shadow dark:bg-gray-800">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                      Fonte
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                      Data
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase dark:text-gray-400">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {savingsList.map((s) => (
                    <tr key={s._id}>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        {s.sourceDescription}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-teal-600 dark:text-teal-400 whitespace-nowrap">
                        {formatCurrency(s.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(s.date).toLocaleDateString("pt-BR", {
                          timeZone: "UTC",
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm text-right whitespace-nowrap">
                        <button
                          onClick={() => handleStartEdit(s)}
                          className="p-2 mr-2 text-gray-500 rounded-full dark:text-gray-400 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-gray-700 dark:hover:text-blue-400"
                          title="Editar registro"
                        >
                          <FaPencilAlt />
                        </button>
                        <button
                          onClick={() => handleDelete(s._id)}
                          className="p-2 text-gray-500 rounded-full dark:text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-gray-700 dark:hover:text-red-400"
                          title="Excluir registro"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={<FaArchive size={32} />}
              title="Nenhum Valor Guardado"
              message="Sua reserva ainda está vazia. Use o formulário abaixo para começar a guardar dinheiro."
            />
          )}
        </div>
      </div>
    </div>
  );
}
