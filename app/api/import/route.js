// Em app/api/import/route.js

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { getUserIdFromToken } from '@/lib/auth';
import User from '@/models/User';
import Income from '@/models/Income';
import Expense from '@/models/Expense';
import Account from '@/models/Account';
import Savings from '@/models/Savings';

export async function POST(request) {
  try {
    const adminId = getUserIdFromToken(request);
    if (!adminId) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    await dbConnect();
    const adminUser = await User.findById(adminId);
    if (adminUser?.role !== 'admin') return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });

    const { type, data } = await request.json();
    if (!type || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ message: 'Dados inválidos' }, { status: 400 });
    }

    let recordsToInsert;

    if (type === 'expenses') {
      const userAccounts = await Account.find({ userId: adminId });
      const accountMap = new Map(userAccounts.map(acc => [acc.name.toLowerCase(), acc._id]));
      recordsToInsert = data.map(record => {
        const { accountName, ...restOfRecord } = record;
        const newRecord = { ...restOfRecord, userId: adminId };
        if (accountName && accountMap.has(accountName.toLowerCase())) {
          newRecord.accountId = accountMap.get(accountName.toLowerCase());
        }
        return newRecord;
      });
      await Expense.insertMany(recordsToInsert, { ordered: false });

    } else if (type === 'incomes') {
      recordsToInsert = data.map(record => ({ ...record, userId: adminId }));
      await Income.insertMany(recordsToInsert, { ordered: false });

    } else if (type === 'savings') {
      recordsToInsert = data.map(record => ({ ...record, userId: adminId }));
      await Savings.insertMany(recordsToInsert, { ordered: false });

    } else if (type === 'accounts') {
      recordsToInsert = data.map(record => {
        const { holderName, last4Digits, ...rest } = record;
        const newRecord = { ...rest, userId: adminId };
        if (record.type === 'credit_card') {
          newRecord.cardDetails = { holderName, last4Digits };
        }
        return newRecord;
      });
      await Account.insertMany(recordsToInsert, { ordered: false });

    } else {
      return NextResponse.json({ message: 'Tipo de importação inválido' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `${data.length} registros importados com sucesso!` });
  } catch (error) {
    console.error("Erro na importação:", error);
    return NextResponse.json({ success: false, error: 'Ocorreu um erro durante a importação.' }, { status: 500 });
  }
}
