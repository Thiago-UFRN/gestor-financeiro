// Em app/api/reports/annual/route.js

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { getUserIdFromToken } from '@/lib/auth';
import Income from '@/models/Income';
import Expense from '@/models/Expense';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const userObjectId = new mongoose.Types.ObjectId(userId);

    await dbConnect();

    // --- LÓGICA PARA ANOS DINÂMICOS ---
    if (searchParams.get('getYears') === 'true') {
      const incomeDates = await Income.distinct('date', { userId: userObjectId });
      const expenseDates = await Expense.distinct('paymentDate', { userId: userObjectId });
      const allDates = [...incomeDates, ...expenseDates];
      const allYears = [...new Set(allDates.map(date => new Date(date).getFullYear()))].sort((a, b) => b - a);
      return NextResponse.json({ success: true, data: allYears });
    }

    // --- LÓGICA PRINCIPAL DO RELATÓRIO ---
    const year = parseInt(yearParam);
    if (!year) return NextResponse.json({ message: 'Ano é obrigatório' }, { status: 400 });

    const yearStartDate = new Date(year, 0, 1);
    const yearEndDate = new Date(year, 11, 31, 23, 59, 59);

    // Promise 1: Busca todas as rendas que podem ser relevantes para o ano (para processamento)
    const allIncomesPromise = Income.find({ 
      userId: userObjectId, 
      date: { $lte: yearEndDate } 
    }).sort({ date: 'asc' });

    // Promise 2: Agrega despesas por mês
    const expenseByMonthPromise = Expense.aggregate([
      { $match: { userId: userObjectId, paymentDate: { $gte: yearStartDate, $lte: yearEndDate } } },
      { $group: { _id: { month: { $month: "$paymentDate" } }, total: { $sum: "$amount" } } }
    ]);

    // Promise 3: Agrega despesas por conta/cartão
    const expensesByAccountPromise = Expense.aggregate([
      { $match: { userId: userObjectId, paymentDate: { $gte: yearStartDate, $lte: yearEndDate } } },
      { $group: { _id: "$accountId", total: { $sum: "$amount" } } },
      {
        $lookup: {
          from: "accounts",
          localField: "_id",
          foreignField: "_id",
          as: "accountDetails"
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Executa todas as consultas em paralelo
    const [
      allIncomesForProcessing, 
      expenseByMonth, 
      expensesByAccount
    ] = await Promise.all([
      allIncomesPromise, 
      expenseByMonthPromise, 
      expensesByAccountPromise
    ]);

    // --- Processamento dos Dados ---
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, income: 0, expense: 0 }));
    const detailedIncomeEvents = [];

    // Preenche as despesas no resumo mensal
    expenseByMonth.forEach(item => {
      const monthIndex = item._id.month - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyData[monthIndex].expense += item.total;
      }
    });

    // Processa as rendas, projetando as mensais e de intervalo para cada mês
    allIncomesForProcessing.forEach(income => {
      const startDate = new Date(income.date);
      const startMonthIndex = startDate.getMonth();
      const startYear = startDate.getFullYear();

      if (income.type === 'unica' && startYear === year) {
        monthlyData[startMonthIndex].income += income.amount;
        detailedIncomeEvents.push(income.toObject());
      } 
      else if (income.type === 'mensal' && startYear <= year) {
        const loopStartMonth = (startYear < year) ? 0 : startMonthIndex;
        for (let i = loopStartMonth; i < 12; i++) {
          monthlyData[i].income += income.amount;
          detailedIncomeEvents.push({
            ...income.toObject(),
            _id: new mongoose.Types.ObjectId(),
            date: new Date(year, i, startDate.getDate()),
          });
        }
      } 
      else if (income.type === 'intervalo' && income.endDate) {
        const endDate = new Date(income.endDate);
        const endMonthIndex = endDate.getMonth();
        const endYear = endDate.getFullYear();
        if (endYear >= year && startYear <= year) {
          const loopStartMonth = (startYear < year) ? 0 : startMonthIndex;
          const loopEndMonth = (endYear > year) ? 11 : endMonthIndex;
          for (let i = loopStartMonth; i <= loopEndMonth; i++) {
            monthlyData[i].income += income.amount;
            detailedIncomeEvents.push({
              ...income.toObject(),
              _id: new mongoose.Types.ObjectId(),
              date: new Date(year, i, startDate.getDate()),
              description: `${income.description} (Mês ${i + 1})`
            });
          }
        }
      }
    });
    
    // Ordena a lista detalhada final por data
    detailedIncomeEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calcula os totais anuais a partir dos dados mensais já processados
    const totalAnnualIncome = monthlyData.reduce((acc, month) => acc + month.income, 0);
    const totalAnnualExpense = monthlyData.reduce((acc, month) => acc + month.expense, 0);

    // Monta o objeto final do relatório
    const report = {
      totalAnnualIncome,
      totalAnnualExpense,
      annualBalance: totalAnnualIncome - totalAnnualExpense,
      monthlyData,
      detailedIncomeEvents, // A nova lista detalhada e precisa
      expensesByAccount,
    };

    return NextResponse.json({ success: true, data: report });

  } catch (error) {
    console.error("Erro no relatório anual:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
