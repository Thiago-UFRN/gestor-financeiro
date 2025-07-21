// Em app/(main)/layout.jsx

import LogoutButton from "@/components/LogoutButton";
import Link from 'next/link';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import ThemeSwitcher from "@/components/ThemeSwitcher";
import NavigationMenu from "@/components/NavigationMenu"; 

// Função para pegar os dados do usuário no servidor (sem alterações)
async function getUserData() {
  const token = cookies().get('token')?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (e) {
    return null;
  }
}

export default async function MainLayout({ children }) {
  const userData = await getUserData();

  return (
    // O fundo principal já estava correto!
    <div className="min-h-screen text-gray-800 bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
      <header className="sticky top-0 z-10 bg-white shadow-sm dark:bg-gray-800 dark:border-b dark:border-gray-700">
        <nav className="container flex items-center justify-between p-4 mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              Meu Gestor Financeiro
            </Link>
            <NavigationMenu userRole={userData?.role} />
          </div>
          <div className="flex items-center gap-4"> 
            <ThemeSwitcher />
            <LogoutButton />
          </div>
        </nav>
      </header>
      <main className="container p-4 mx-auto">
        {children}
      </main>
    </div>
  );
}
