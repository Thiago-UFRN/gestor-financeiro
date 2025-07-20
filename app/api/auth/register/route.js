// Em app/api/auth/register/route.js

import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    await dbConnect();

    const adminId = getUserIdFromToken(request); // Pega o ID de quem está logado
    if (!adminId) {
      return NextResponse.json({ message: 'Apenas admins logados podem registrar novos usuários.' }, { status: 403 });
    }

    const adminUser = await User.findById(adminId);
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ message: 'Acesso negado.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, role } = body;

    // Validação simples
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Nome, e-mail e senha são obrigatórios.' },
        { status: 400 }
      );
    }
    
    // 1. Verificar se o usuário já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: 'Este e-mail já está em uso.' },
        { status: 409 } // 409 Conflict
      );
    }
    
    // 2. Criar o novo usuário (a senha será hasheada pelo middleware do Schema)
    const newUser = new User({
      name,
      email,
      password, // Passamos a senha pura, o Schema cuida do hash
      role: role || 'member', // Se não for especificado, será 'member'
    });

    await newUser.save();

    // Removemos a senha do objeto de resposta por segurança
    const userResponse = newUser.toObject();
    delete userResponse.password;

    return NextResponse.json(
      { message: 'Usuário criado com sucesso!', user: userResponse },
      { status: 201 } // 201 Created
    );

  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    return NextResponse.json(
      { message: 'Ocorreu um erro no servidor.', error: error.message },
      { status: 500 }
    );
  }
}
