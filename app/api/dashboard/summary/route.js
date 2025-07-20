// Em app/api/dashboard/summary/route.js

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { getUserIdFromToken } from '@/lib/auth';
import Income from '@/models/Income';
import Expense from '@/models/Expense';
import Account from '@/models/Account';
import { startOfMonth, endOfMonth } from 'date-fns';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const month = parseInt(searchParams.get('month')) || now.getMonth() + 1;
    const year = parseInt(searchParams.get('year')) || now.getFullYear();

    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));

    await dbConnect();

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const incomePromise = Income.aggregate([
      {
        $match: {
          userId: userObjectId,
          $or: [
            { type: 'unica', date: { $gte: startDate, $lte: endDate } },
            { type: 'mensal', date: { $lte: endDate } },
            { type: 'intervalo', startDate: { $lte: endDate }, endDate: { $gte: startDate } }
          ]
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const expensePromise = Expense.aggregate([
      { $match: { userId: userObjectId, paymentDate: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const categoryPromise = Expense.aggregate([
      { $match: { userId: userObjectId, paymentDate: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ]);

    const topExpensesPromise = Expense.find({
      userId: userObjectId,
      paymentDate: { $gte: startDate, $lte: endDate }
    })
    .sort({ amount: -1 }) // Ordena pela maior despesa
    .limit(5) // Pega apenas as 5 maiores
    .populate('accountId'); // Traz os dados da conta, se houver

    const [
      incomeResult, 
      expenseResult, 
      expensesByCategory, 
      topExpenses // O resultado da nova consulta
    ] = await Promise.all([
      incomePromise,
      expensePromise,
      categoryPromise,
      topExpensesPromise // Adiciona a promessa à execução
    ]);

    const totalIncome = incomeResult[0]?.total || 0;
    const totalExpenses = expenseResult[0]?.total || 0;
    
    const summary = {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      expensesByCategory,
      topExpenses
    };

    return NextResponse.json({ success: true, data: summary });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
