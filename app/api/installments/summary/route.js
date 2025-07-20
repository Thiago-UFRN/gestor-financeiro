// Em app/api/installments/summary/route.js

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { getUserIdFromToken } from '@/lib/auth';
import Expense from '@/models/Expense';
import { startOfMonth } from 'date-fns';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    await dbConnect();

    // Queremos todas as parcelas a partir do início do mês atual
    const today = new Date();
    const startDate = startOfMonth(today);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Usamos o Aggregation Pipeline para calcular tudo no banco de dados
    const futureDebt = await Expense.aggregate([
      // 1. Encontrar os documentos relevantes
      {
        $match: {
          userId: userObjectId,
          isInstallment: true,
          paymentDate: { $gte: startDate } // Apenas parcelas futuras
        }
      },
      // 2. Agrupar por ano e mês
      {
        $group: {
          _id: {
            year: { $year: "$paymentDate" },
            month: { $month: "$paymentDate" }
          },
          totalAmount: { $sum: "$amount" } // Somar o valor das parcelas de cada mês
        }
      },
      // 3. Ordenar o resultado cronologicamente
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1
        }
      }
    ]);

    return NextResponse.json({ success: true, data: futureDebt });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
