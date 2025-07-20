// Em app/api/accounts/route.js

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { getUserIdFromToken } from '@/lib/auth';
import Account from '@/models/Account';
import mongoose from 'mongoose';
import Expense from '@/models/Expense';

// --- GET: Listar todas as contas do usuário ---
export async function GET(request) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }
    await dbConnect();
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const accounts = await Account.find({ userId: userObjectId }).sort({ createdAt: 'asc' });
    return NextResponse.json({ success: true, data: accounts });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// --- POST: Criar uma nova conta ---
export async function POST(request) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }
    await dbConnect();
    const body = await request.json();
    const newAccount = await Account.create({ ...body, userId });
    return NextResponse.json({ success: true, data: newAccount }, { status: 201 });
  } catch (error) {
    // ... (Tratamento de erro de validação) ...
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// --- NOVO: PUT: Para atualizar uma conta existente ---
export async function PUT(request) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'ID da conta é obrigatório' }, { status: 400 });

    const body = await request.json();
    await dbConnect();

    const updatedAccount = await Account.findOneAndUpdate(
      { _id: id, userId },
      body,
      { new: true, runValidators: true }
    );

    if (!updatedAccount) return NextResponse.json({ message: 'Conta não encontrada' }, { status: 404 });

    return NextResponse.json({ success: true, data: updatedAccount });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// --- DELETE: Para excluir uma conta ---
export async function DELETE(request) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'ID da conta é obrigatório' }, { status: 400 });

    await dbConnect();

    // Esta operação remove o vínculo da conta das despesas associadas.
    await Expense.updateMany({ accountId: id }, { $unset: { accountId: "" } });

    const deletedAccount = await Account.findOneAndDelete({ _id: id, userId });

    if (!deletedAccount) return NextResponse.json({ message: 'Conta não encontrada' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Conta excluída com sucesso' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
