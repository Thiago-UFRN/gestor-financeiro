// Em components/LogoutButton.jsx

"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout');
      // Redireciona e atualiza o estado para garantir que o middleware rode novamente
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Falha no logout:", error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
    >
      Sair
    </button>
  );
}
