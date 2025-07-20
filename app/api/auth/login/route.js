// Em app/api/auth/login/route.js

import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    await dbConnect();

    const { email, password } = await request.json();

    // 1. Validar se email e senha foram enviados
    if (!email || !password) {
      return NextResponse.json({ message: 'E-mail e senha são obrigatórios.' }, { status: 400 });
    }

    // 2. Encontrar o usuário no banco de dados
    // Usamos .select('+password') para forçar o Mongoose a incluir a senha na busca,
    // já que no Schema definimos 'select: false' por padrão.
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      // Usamos uma mensagem genérica para não informar a um atacante se o e-mail existe ou não
      return NextResponse.json({ message: 'Credenciais inválidas.' }, { status: 401 });
    }

    // 3. Comparar a senha enviada com a senha hasheada no banco
    const isPasswordMatch = await bcryptjs.compare(password, user.password);

    if (!isPasswordMatch) {
      return NextResponse.json({ message: 'Credenciais inválidas.' }, { status: 401 });
    }

    // 4. Se tudo estiver correto, criar o Payload para o JWT
    const payload = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    // 5. Assinar o token com a sua chave secreta
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1d', // Token expira em 1 dia
    });
    
    // 6. Criar uma resposta de sucesso e armazenar o token em um cookie seguro
    const response = NextResponse.json({ message: 'Login bem-sucedido!', user: payload }, { status: 200 });

    response.cookies.set('token', token, {
      httpOnly: true, // Impede que o cookie seja acessado por JavaScript no cliente (essencial para segurança)
      secure: process.env.NODE_ENV !== 'development', // Em produção, o cookie só será enviado por HTTPS
      maxAge: 60 * 60 * 24 * 1, // Duração do cookie em segundos (1 dia)
      path: '/', // O cookie estará disponível em todas as páginas do site
    });

    return response;

  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json({ message: 'Ocorreu um erro no servidor.', error: error.message }, { status: 500 });
  }
}