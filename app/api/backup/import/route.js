// Em app/api/backup/import/route.js

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
import mongoose from 'mongoose';

export async function POST(request) {
  try {
    const adminId = getUserIdFromToken(request);
    if (!adminId) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { password, fileContent } = await request.json();
    if (!password || !fileContent) return NextResponse.json({ message: 'Senha e conteúdo do arquivo são obrigatórios' }, { status: 400 });

    await dbConnect();
    const adminUser = await User.findById(adminId).select('+password');
    if (adminUser?.role !== 'admin') return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });

    const isPasswordMatch = await bcryptjs.compare(password, adminUser.password);
    if (!isPasswordMatch) return NextResponse.json({ message: 'Senha inválida' }, { status: 401 });

    let backupData;
    try {
      const decryptedBytes = CryptoJS.AES.decrypt(fileContent, password);
      const decryptedJson = decryptedBytes.toString(CryptoJS.enc.Utf8);
      if (!decryptedJson) throw new Error('Falha na descriptografia');
      backupData = JSON.parse(decryptedJson);
    } catch (e) {
      return NextResponse.json({ message: 'Senha incorreta ou arquivo de backup corrompido.' }, { status: 400 });
    }

    await Promise.all([
      Income.deleteMany({ userId: adminId }),
      Expense.deleteMany({ userId: adminId }),
      Savings.deleteMany({ userId: adminId }),
      Account.deleteMany({ userId: adminId })
    ]);

    const { incomes, expenses, savings, accounts } = backupData;

    // Esta função converte todos os IDs de string de volta para ObjectId, preservando os relacionamentos.
    const processRecords = (records) => {
      return records.map(r => {
        const newRecord = { ...r };
        // Converte o _id principal
        newRecord._id = new mongoose.Types.ObjectId(r._id);
        // Garante que o userId é o do admin logado
        newRecord.userId = new mongoose.Types.ObjectId(adminId);
        // Se houver um accountId na despesa, converte-o também
        if (r.accountId) {
          newRecord.accountId = new mongoose.Types.ObjectId(r.accountId);
        }
        // Se houver um purchaseId na despesa, converte-o também
        if (r.installmentDetails?.purchaseId) {
            newRecord.installmentDetails.purchaseId = new mongoose.Types.ObjectId(r.installmentDetails.purchaseId);
        }
        return newRecord;
      });
    };
    
    // Insere os dados processados, preservando os IDs originais
    await Promise.all([
      accounts?.length > 0 && Account.insertMany(processRecords(accounts)),
      savings?.length > 0 && Savings.insertMany(processRecords(savings)),
      incomes?.length > 0 && Income.insertMany(processRecords(incomes)),
      expenses?.length > 0 && Expense.insertMany(processRecords(expenses)),
    ]);

    return NextResponse.json({ success: true, message: "Dados restaurados com sucesso!" });

  } catch (error) {
    console.error("Erro ao restaurar backup:", error);
    return NextResponse.json({ success: false, error: 'Erro ao restaurar backup.' }, { status: 500 });
  }
}
