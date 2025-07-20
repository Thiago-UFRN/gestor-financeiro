// Em app/api/installments/all/route.js

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { getUserIdFromToken } from '@/lib/auth';
import Expense from '@/models/Expense';
import { startOfToday } from 'date-fns';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    await dbConnect();

    // Pega todas as parcelas a partir de hoje
    const startDate = startOfToday();
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const allInstallments = await Expense.find({
      userId: userObjectId,
      isInstallment: true,
      accountId: { $exists: true, $ne: null }, // Apenas parcelas vinculadas a uma conta
      paymentDate: { $gte: startDate }
    })
    .sort({ paymentDate: 1 }) // Ordena pela data
    .populate('accountId'); // Crucial: Traz os dados da conta junto

    return NextResponse.json({ success: true, data: allInstallments });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
