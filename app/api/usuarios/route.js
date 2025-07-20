// Em app/api/usuarios/route.js

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { getUserIdFromToken } from '@/lib/auth'; // Usaremos para verificar a role

export async function GET(request) {
  try {
    const adminId = getUserIdFromToken(request);
    if (!adminId) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }
    await dbConnect();

    // Verifica se o usuário que está fazendo a requisição é um admin
    const adminUser = await User.findById(adminId);
    if (adminUser?.role !== 'admin') {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
    }

    // Busca todos os usuários, exceto o próprio admin
    const users = await User.find({ _id: { $ne: adminId } }).select('name email role createdAt');
    return NextResponse.json({ success: true, data: users });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
    try {
        const adminId = getUserIdFromToken(request);
        if (!adminId) {
            return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
        }
        await dbConnect();

        const adminUser = await User.findById(adminId);
        if (adminUser?.role !== 'admin') {
            return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const userIdToDelete = searchParams.get('id');

        if (!userIdToDelete) {
            return NextResponse.json({ message: 'ID do usuário é obrigatório' }, { status: 400 });
        }

        // Impede o admin de se auto-deletar por esta rota
        if (userIdToDelete === adminId) {
            return NextResponse.json({ message: 'Admin não pode se auto-excluir' }, { status: 400 });
        }

        await User.findByIdAndDelete(userIdToDelete);
        // Aqui você também poderia adicionar a lógica para deletar todas as rendas/despesas do usuário excluído

        return NextResponse.json({ success: true, message: 'Usuário excluído com sucesso' });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
