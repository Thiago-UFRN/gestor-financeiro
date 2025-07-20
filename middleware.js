// Em middleware.js

import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose'; // Usaremos 'jose' que é mais moderno e compatível com o Edge Runtime

// Função para verificar o token JWT
async function verifyToken(token) {
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error("Erro na verificação do token:", error);
    return null;
  }
}

export async function middleware(request) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get('token')?.value || '';

  // Rotas que não precisam de login
  const isPublicPath = path === '/login';

  // Se o usuário está em uma rota pública e já tem um token, redireciona
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
  }

  // Se o usuário tenta acessar uma rota protegida sem token, redireciona
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  if (path.startsWith('/admin')) {
    const userData = await verifyToken(token);
    // Se não for admin, redireciona para o dashboard com uma mensagem de erro (opcional)
    if (userData?.role !== 'admin') {
      const url = new URL('/dashboard', request.nextUrl);
      url.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/despesas/:path*',
    '/rendas/:path*',
    '/reservas/:path*',
    '/parcelamentos/:path*',
    '/admin/:path*', // Protegendo a rota de admin
    '/login'
  ],
};
