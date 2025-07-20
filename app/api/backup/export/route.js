// Em app/api/backup/export/route.js

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { getUserIdFromToken } from '@/lib/auth';
import User from '@/models/User';
import Income from '@/models/Income';
import Expense from '@/models/Expense';
import Savings from '@/models/Savings';
import Account from '@/models/Account';
import bcryptjs from 'bcryptjs';
import CryptoJS from 'crypto-js';

export async function POST(request) {
  try {
    const adminId = getUserIdFromToken(request);
    if (!adminId) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    
    await dbConnect();
    
    const { password } = await request.json();
    if (!password) return NextResponse.json({ message: 'Senha é obrigatória' }, { status: 400 });

    const adminUser = await User.findById(adminId).select('+password');
    if (adminUser?.role !== 'admin') return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });

    const isPasswordMatch = await bcryptjs.compare(password, adminUser.password);
    if (!isPasswordMatch) return NextResponse.json({ message: 'Senha inválida' }, { status: 401 });

    // Busca os dados usando .lean() para garantir que todos os campos sejam incluídos
    const [incomes, expenses, savings, accounts] = await Promise.all([
      Income.find({ userId: adminId }).lean(),
      Expense.find({ userId: adminId }).lean(),
      Savings.find({ userId: adminId }).lean(),
      Account.find({ userId: adminId }).lean()
    ]);

    const backupData = { version: 1, exportedAt: new Date(), incomes, expenses, savings, accounts };
    const jsonString = JSON.stringify(backupData);

    // Criptografa a string JSON com a senha do admin
    const encryptedData = CryptoJS.AES.encrypt(jsonString, password).toString();

    // Retorna o dado criptografado dentro de uma propriedade 'data'
    return NextResponse.json({ success: true, data: encryptedData });

  } catch (error) {
    console.error("Erro ao gerar backup:", error);
    return NextResponse.json({ success: false, error: 'Erro ao gerar backup.' }, { status: 500 });
  }
}
