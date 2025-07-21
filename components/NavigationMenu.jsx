// Em components/NavigationMenu.jsx

"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react'; // Importar useState e useEffect
import { FaBars, FaTimes } from 'react-icons/fa'; // Ícones de Hambúrguer e Fechar

export default function NavigationMenu({ userRole }) {
  const pathname = usePathname();
  // Estado para controlar se o menu mobile está aberto ou fechado
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [,
    { href: '/rendas', label: 'Rendas' },
    { href: '/despesas', label: 'Despesas' },
    { href: '/reservas', label: 'Reservas' },
    { href: '/parcelamentos', label: 'Parcelamentos' },
    { href: '/contas', label: 'Contas' },
    { href: '/relatorios', label: 'Relatórios' },
  ];

  // Efeito para fechar o menu mobile se a rota mudar
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      {/* --- MENU DESKTOP --- */}
      {/* Escondido em telas pequenas (hidden), vira flex em telas médias ou maiores (md:flex) */}
      <div className="hidden md:flex items-center space-x-4">
        {navLinks.map(link => {
          const isActive = pathname === link.href;
          return (
            <Link key={link.href} href={link.href}
              className={`text-sm font-medium transition-colors duration-200 ${isActive ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-gray-600 hover:text-indigo-500 dark:text-gray-300 dark:hover:text-indigo-400'}`}>
              {link.label}
            </Link>
          )
        })}
        {userRole === 'admin' && (
          <Link href="/admin/usuarios"
            className={`text-sm font-medium transition-colors duration-200 ${pathname.startsWith('/admin') ? 'text-purple-600 dark:text-purple-400 font-semibold' : 'text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300'}`}>
            Admin
          </Link>
        )}
      </div>

      {/* --- BOTÃO DO MENU MOBILE (HAMBÚRGUER) --- */}
      {/* Aparece apenas em telas pequenas (block), desaparece em telas médias ou maiores (md:hidden) */}
      <div className="md:hidden order-first">
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-700 dark:text-gray-300">
          {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </div>

      {/* --- MENU MOBILE FLUTUANTE (OVERLAY) --- */}
      {/* Renderizado condicionalmente com base no estado */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-[65px] left-0 w-full bg-white dark:bg-gray-800 shadow-lg border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col px-4 py-3 space-y-3">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href}
                className="px-3 py-2 text-base font-medium text-gray-700 rounded-md dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                {link.label}
              </Link>
            ))}
            {userRole === 'admin' && (
              <Link href="/admin/usuarios"
                className="px-3 py-2 text-base font-medium text-purple-600 rounded-md dark:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                Admin
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
