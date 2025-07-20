// Em components/EmptyState.jsx

import React from 'react';

// Este componente recebe um ícone, título, mensagem e um "filho" (geralmente um botão)
export default function EmptyState({ icon, title, message, children }) {
  return (
    <div className="w-full px-4 py-16 text-center bg-white border-2 border-dashed rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center justify-center w-16 h-16 mx-auto text-gray-400 bg-gray-100 rounded-full dark:bg-gray-700 dark:text-gray-500">
        {icon}
      </div>
      <h3 className="mt-4 text-xl font-semibold text-gray-800 dark:text-gray-100">
        {title}
      </h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {message}
      </p>
      <div className="mt-6">
        {children}
      </div>
    </div>
  );
}
