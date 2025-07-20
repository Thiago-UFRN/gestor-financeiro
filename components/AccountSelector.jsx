// Em components/AccountSelector.jsx

"use client";

import { useState, useEffect } from 'react';
import AccountChip from './AccountChip';

export default function AccountSelector({ selectedAccountId, onChange }) {
  const [accounts, setAccounts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch('/api/accounts');
        const data = await res.json();
        if (res.ok) setAccounts(data.data);
      } catch (error) {
        console.error("Falha ao buscar contas:", error);
      }
    };
    fetchAccounts();
  }, []);

  const selectedAccount = accounts.find(acc => acc._id === selectedAccountId);

  return (
    <div className="relative">
      <label htmlFor="account" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Conta / Cartão (Opcional)</label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        // Adicionamos altura fixa (h-10) para alinhar com outros inputs e ajustamos o padding
        className="flex items-center w-full h-10 px-2 mt-1 text-left bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
      >
        {selectedAccount ? (
          <AccountChip name={selectedAccount.name} color={selectedAccount.color} small />
        ) : (
          <span className="text-gray-500 dark:text-gray-400">Nenhuma</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg dark:bg-gray-700 dark:border-gray-600">
          <ul className="py-1 max-h-60 overflow-y-auto">
            <li
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="px-3 py-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Nenhuma
            </li>
            {accounts.map(account => (
              <li
                key={account._id}
                onClick={() => {
                  onChange(account._id);
                  setIsOpen(false);
                }}
                className="px-2 py-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <AccountChip name={account.name} color={account.color} small />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
