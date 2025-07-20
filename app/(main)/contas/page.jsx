// Em app/(main)/contas/page.jsx

"use client";

import { useState, useEffect } from "react";
import AccountChip from "@/components/AccountChip";
import EmptyState from "@/components/EmptyState";
import { FaCreditCard, FaPencilAlt, FaTrash, FaFileCsv } from "react-icons/fa";
import { CSVLink } from "react-csv";

export default function ContasPage() {
  // Estados do formulário
  const [name, setName] = useState("");
  const [type, setType] = useState("credit_card");
  const [color, setColor] = useState("#820AD1");
  const [holderName, setHolderName] = useState("");
  const [last4Digits, setLast4Digits] = useState("");

  // Estados da UI
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(""); // Erro para a listagem

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch("/api/accounts");
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setAccounts(data.data);
      } catch (err) {
        setError(err.message); // Usa o estado de erro principal para a busca
      } finally {
        setIsLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  const handleStartEdit = (account) => {
    setEditingId(account._id);
    setName(account.name);
    setType(account.type);
    setColor(account.color);
    setHolderName(account.cardDetails?.holderName || "");
    setLast4Digits(account.cardDetails?.last4Digits || "");
    setFormSuccess("");
    setFormError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
    setType("credit_card");
    setColor("#820AD1");
    setHolderName("");
    setLast4Digits("");
    setFormSuccess("");
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setIsSubmitting(true);
    const body = {
      name,
      type,
      color,
      cardDetails:
        type === "credit_card" ? { holderName, last4Digits } : undefined,
    };

    try {
      const url = editingId ? `/api/accounts?id=${editingId}` : "/api/accounts";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Falha na operação");

      if (editingId) {
        setAccounts(
          accounts.map((acc) => (acc._id === editingId ? data.data : acc))
        );
        setFormSuccess("Conta atualizada com sucesso!");
      } else {
        setAccounts([...accounts, data.data]);
        setFormSuccess("Conta salva com sucesso!");
      }
      handleCancelEdit();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (accountId) => {
    if (
      !window.confirm(
        "Tem certeza que deseja excluir esta conta? As despesas associadas a ela não serão excluídas, mas ficarão sem uma conta vinculada."
      )
    )
      return;
    try {
      const res = await fetch(`/api/accounts?id=${accountId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Falha ao excluir a conta");
      setAccounts(accounts.filter((acc) => acc._id !== accountId));
    } catch (err) {
      alert(err.message);
    }
  };

  const getCsvData = () => {
    const headers = [
      { label: "Nome da Conta", key: "name" },
      { label: "Tipo", key: "type" },
      { label: "Cor", key: "color" },
      { label: "Nome do Titular", key: "holderName" },
      { label: "Últimos 4 Dígitos", key: "last4Digits" },
    ];

    const data = accounts.map((acc) => ({
      name: acc.name,
      type: acc.type === "credit_card" ? "Cartão de Crédito" : "Conta Bancária",
      color: acc.color,
      holderName: acc.cardDetails?.holderName || "N/A",
      last4Digits: acc.cardDetails?.last4Digits || "N/A",
    }));

    return { data, headers };
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
        Gerenciar Contas
      </h1>
      <div className="grid grid-cols-1 gap-8 mt-8 lg:grid-cols-3">
        {/* Coluna do Formulário */}
        <div className="p-6 bg-white rounded-lg shadow-md lg:col-span-1 dark:bg-gray-800">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
            {editingId ? "Editar Conta/Cartão" : "Adicionar Conta/Cartão"}
          </h2>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Nome da Conta/Cartão
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full mt-1 input-form"
              />
            </div>
            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Tipo
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full mt-1 input-form"
              >
                <option value="credit_card">Cartão de Crédito</option>
                <option value="bank_account">Conta Bancária</option>
              </select>
            </div>

            {type === "credit_card" && (
              <>
                <div>
                  <label
                    htmlFor="holderName"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Nome do Titular
                  </label>
                  <input
                    type="text"
                    id="holderName"
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value)}
                    className="w-full mt-1 input-form"
                  />
                </div>
                <div>
                  <label
                    htmlFor="last4Digits"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Últimos 4 dígitos
                  </label>
                  <input
                    type="text"
                    maxLength="4"
                    id="last4Digits"
                    value={last4Digits}
                    onChange={(e) => setLast4Digits(e.target.value)}
                    className="w-full mt-1 input-form"
                  />
                </div>
                <div>
                  <label
                    htmlFor="color"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Cor do Cartão
                  </label>
                  <input
                    type="color"
                    id="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full h-10 mt-1"
                  />
                </div>
              </>
            )}
            <div className="pt-2">
              {formError && (
                <p className="text-sm text-center text-red-600">{formError}</p>
              )}
              {formSuccess && (
                <p className="text-sm text-center text-green-600">
                  {formSuccess}
                </p>
              )}
            </div>
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
                disabled={isSubmitting}
                className="px-6 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
              >
                {isSubmitting
                  ? "Salvando..."
                  : editingId
                  ? "Salvar"
                  : "Adicionar"}
              </button>
            </div>
          </form>
        </div>

        {/* Coluna da Listagem */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
              Contas Cadastradas
            </h2>
            {accounts.length > 0 && (
              <CSVLink
                data={getCsvData().data}
                headers={getCsvData().headers}
                filename={`contas-e-cartoes.csv`}
                className="inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                <FaFileCsv className="mr-2" />
                Exportar
              </CSVLink>
            )}
          </div>

          {isLoading ? (
            <p>Carregando...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : accounts.length > 0 ? (
            <div className="space-y-4">
              {accounts.map((acc) => (
                <div
                  key={acc._id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md dark:bg-gray-800"
                >
                  <div className="flex flex-col flex-grow">
                    <span className="font-bold text-gray-800 dark:text-gray-100">
                      {acc.name}
                    </span>
                    {acc.type === "credit_card" &&
                      acc.cardDetails?.last4Digits && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Final •••• {acc.cardDetails.last4Digits}
                        </span>
                      )}
                  </div>
                  <div className="w-24 mr-4 shrink-0">
                    <AccountChip name={acc.name} color={acc.color} />
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleStartEdit(acc)}
                      className="p-2 text-gray-500 rounded-full dark:text-gray-400 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-gray-700 dark:hover:text-blue-400"
                      title="Editar conta"
                    >
                      <FaPencilAlt />
                    </button>
                    <button
                      onClick={() => handleDelete(acc._id)}
                      className="p-2 text-gray-500 rounded-full dark:text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-gray-700 dark:hover:text-red-400"
                      title="Excluir conta"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<FaCreditCard size={32} />}
              title="Nenhuma Conta Cadastrada"
              message="Você ainda não adicionou nenhuma conta ou cartão. Use o formulário ao lado para começar."
            />
          )}
        </div>
      </div>
    </div>
  );
}
