// Em app/api/reservas/evolution/route.js

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { getUserIdFromToken } from '@/lib/auth';
import Savings from '@/models/Savings';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    await dbConnect();
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // 1. Busca todos os registros de reserva do usuário, ordenados por data
    const allSavings = await Savings.find({ userId: userObjectId }).sort({ date: 'asc' });

    // 2. Processa os dados para criar a linha do tempo com o total acumulado
    let cumulativeTotal = 0;
    const evolutionData = allSavings.map(saving => {
      cumulativeTotal += saving.amount;
      return {
        date: saving.date,
        total: cumulativeTotal,
      };
    });

    return NextResponse.json({ success: true, data: evolutionData });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
