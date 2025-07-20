// Em components/ThemeSwitcher.jsx

"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { FaSun, FaMoon } from 'react-icons/fa';

export default function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Função de clique para depuração
  const handleThemeToggle = () => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    console.log(`--- Clicou no Botão ---`);
    console.log(`Tema resolvido ATUAL: ${resolvedTheme}`);
    console.log(`Tentando mudar para o tema: ${newTheme}`);
    setTheme(newTheme);
  };

  if (!mounted) {
    return null;
  }

  const isDarkMode = resolvedTheme === 'dark';

  return (
    <button
      aria-label="Trocar tema"
      onClick={handleThemeToggle} // Usando a nova função de depuração
      className="p-2 text-gray-500 rounded-full dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      {isDarkMode ? <FaSun /> : <FaMoon />}
    </button>
  );
}
