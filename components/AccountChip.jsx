// Em components/AccountChip.jsx

import React from 'react';
import { FaRegCreditCard } from 'react-icons/fa'; // Ícone para o chip do cartão

export default function AccountChip({ name, color, small = false }) {
  // Função para determinar se a cor de fundo é escura ou clara
  const isColorDark = (hexColor) => {
    if (!hexColor) return false;
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminosity = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminosity < 0.6;
  };

  const textColor = isColorDark(color) ? 'text-white' : 'text-black';

  // Define o tamanho com base na propriedade 'small'
  const sizeClasses = small 
    ? "w-24 h-8 text-xs" // Tamanho menor para o seletor
    : "w-24 h-14 text-sm"; // Tamanho padrão para as listas

  return (
    <div
      className={`relative rounded-md shadow-sm flex flex-col justify-between overflow-hidden p-2 ${sizeClasses}`}
      style={{ backgroundColor: color }}
    >
      <div className="flex items-center gap-2">
        <FaRegCreditCard className={`opacity-70 ${textColor}`} size={small ? 14 : 18} />
        <span className={`font-semibold ${textColor} truncate`}>
          {name}
        </span>
      </div>
      <div className="w-full h-1/4 bg-black opacity-80 rounded-sm"></div>
    </div>
  );
}
