// Em components/NavigationMenu.jsx

"use client"; // Marcamos como um componente de cliente para usar o hook

import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Importamos o hook

export default function NavigationMenu({ userRole }) {
  // O hook nos dá a URL atual, ex: "/dashboard", "/rendas"
  const pathname = usePathname();

  const navLinks = [
    { href: '/rendas', label: 'Rendas' },
    { href: '/despesas', label: 'Despesas' },
    { href: '/reservas', label: 'Reservas' },
    { href: '/parcelamentos', label: 'Parcelamentos' },
    { href: '/contas', label: 'Contas' },
    { href: '/relatorios', label: 'Relatórios' },
  ];

  return (
    <div className="flex items-center space-x-4">
      {navLinks.map(link => {
        // Verifica se o link atual é o ativo
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            // Aplica classes diferentes se o link estiver ativo
            className={`text-sm font-medium transition-colors duration-200 
              ${isActive
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold' // Estilo ATIVO
                : 'text-gray-600 hover:text-indigo-500 dark:text-gray-300 dark:hover:text-indigo-400' // Estilo INATIVO
              }`
            }
          >
            {link.label}
          </Link>
        )
      })}
      
      {/* Link Condicional para Admin */}
      {userRole === 'admin' && (
        <Link 
          href="/admin/usuarios"
          className={`text-sm font-medium transition-colors duration-200
            ${pathname.startsWith('/admin')
              ? 'text-purple-600 dark:text-purple-400 font-semibold' // Estilo ATIVO para Admin
              : 'text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300' // Estilo INATIVO para Admin
            }`
          }
        >
          Admin
        </Link>
      )}
    </div>
  );
}
