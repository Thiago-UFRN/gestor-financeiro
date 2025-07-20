// Em app/api/rendas/route.js

import dbConnect from '@/lib/dbConnect';
import Income from '@/models/Income';
import { NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth';
import { startOfMonth, endOfMonth } from 'date-fns';
import mongoose from 'mongoose';

// --- FUNÇÃO GET: Para buscar todas as rendas do usuário logado ---
export async function GET(request) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month'));
    const year = parseInt(searchParams.get('year'));
    if (!month || !year) return NextResponse.json({ message: 'Mês e ano são obrigatórios' }, { status: 400 });

    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));
    const userObjectId = new mongoose.Types.ObjectId(userId);

    await dbConnect();

    const incomes = await Income.find({
      userId: userObjectId,
      $or: [
        { type: 'unica', date: { $gte: startDate, $lte: endDate } },
        { type: 'mensal', date: { $lte: endDate } }, // Começou antes ou durante este mês
        { type: 'intervalo', startDate: { $lte: endDate }, endDate: { $gte: startDate } }
      ]
    }).sort({ date: -1 });

    return NextResponse.json({ success: true, data: incomes });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// --- FUNÇÃO POST: Para criar uma nova renda ---
export async function POST(request) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();

    // Adiciona o ID do usuário ao corpo da requisição para salvar no banco
    const incomeData = { ...body, userId };

    const newIncome = await Income.create(incomeData);

    return NextResponse.json({ success: true, data: newIncome }, { status: 201 });

  } catch (error) {
    // Trata erros de validação do Mongoose de forma mais amigável
    if (error.name === 'ValidationError') {
      let errors = {};
      Object.keys(error.errors).forEach((key) => {
        errors[key] = error.errors[key].message;
      });
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// --- FUNÇÃO DELETE: Para apagar uma renda específica ---
export async function DELETE(request) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    // Pegamos o ID da renda a ser deletada a partir dos parâmetros da URL
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'ID da renda é obrigatório' }, { status: 400 });
    }

    await dbConnect();

    // A mágica da segurança acontece aqui:
    // Só deleta o documento se o _id bater E o userId também bater.
    // Isso impede que um usuário delete a renda de outro.
    const deletedIncome = await Income.findOneAndDelete({ _id: id, userId });

    if (!deletedIncome) {
      return NextResponse.json({ message: 'Renda não encontrada ou não pertence ao usuário' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Renda excluída com sucesso' }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id'); // ID da renda a ser atualizada

    if (!id) {
      return NextResponse.json({ message: 'ID da renda é obrigatório' }, { status: 400 });
    }

    const body = await request.json();
    await dbConnect();

    // Encontra e atualiza a renda, garantindo que ela pertence ao usuário logado
    const updatedIncome = await Income.findOneAndUpdate(
      { _id: id, userId }, // Condição de busca (segurança)
      body, // Novos dados a serem aplicados
      { new: true, runValidators: true } // Opções: retorna o documento atualizado e roda as validações do schema
    );

    if (!updatedIncome) {
      return NextResponse.json({ message: 'Renda não encontrada ou não pertence ao usuário' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedIncome }, { status: 200 });

  } catch (error) {
    if (error.name === 'ValidationError') {
        let errors = {};
        Object.keys(error.errors).forEach((key) => {
            errors[key] = error.errors[key].message;
        });
        return NextResponse.json({ success: false, errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
