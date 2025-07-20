// Em app/page.jsx

import { redirect } from 'next/navigation';

export default function HomePage() {
  // Esta função interrompe a renderização e envia o usuário para a rota de login
  redirect('/login');
}
