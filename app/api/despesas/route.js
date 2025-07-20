// Em app/api/despesas/route.js

import dbConnect from '@/lib/dbConnect';
import Expense from '@/models/Expense';
import { NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth';
import { addMonths, startOfMonth, endOfMonth } from 'date-fns';
import mongoose from 'mongoose';
import User from '@/models/User';

// --- FUNÇÃO GET: Para buscar despesas de um mês específico ---
export async function GET(request) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month'));
    const year = parseInt(searchParams.get('year'));

    if (!month || !year) {
      return NextResponse.json({ message: 'Mês e ano são obrigatórios.' }, { status: 400 });
    }

    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));
    const userObjectId = new mongoose.Types.ObjectId(userId);

    await dbConnect();

    const expenses = await Expense.find({
      userId: userObjectId,
      paymentDate: {
        $gte: startDate,
        $lte: endDate,
      },
    })
    .sort({ paymentDate: 'asc' })
    .populate('accountId');

    return NextResponse.json({ success: true, data: expenses });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// --- FUNÇÃO POST: Para criar uma nova despesa (com lógica de parcelamento) ---
export async function POST(request) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }
    const user = await User.findById(userId);

    await dbConnect();
    const body = await request.json();
    const { description, totalAmount, paymentDate, category, type, installments = 1, accountId } = body;

    if (installments > 1) {
      const installmentValue = parseFloat((totalAmount / installments).toFixed(2));
      const purchaseId = new mongoose.Types.ObjectId();
      const expensePromises = [];
      for (let i = 0; i < installments; i++) {
        expensePromises.push({
          userId,
          description: `${description} (${i + 1}/${installments})`,
          amount: installmentValue,
          paymentDate: addMonths(new Date(paymentDate), i),
          category,
          type: 'pontual',
          isInstallment: true,
          accountId,
          installmentDetails: {
            purchaseId,
            currentInstallment: i + 1,
            totalInstallments: installments,
            totalAmount: totalAmount,
          },
        });
      }
      await Expense.insertMany(expensePromises);
      return NextResponse.json({ success: true, message: `${installments} parcelas criadas com sucesso!` }, { status: 201 });
    } else {
      const newExpense = await Expense.create({
        userId,
        description,
        amount: totalAmount,
        paymentDate,
        category,
        type,
        isInstallment: false,
        accountId,
      });
      return NextResponse.json({ success: true, data: newExpense }, { status: 201 });
    }
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

// --- FUNÇÃO PUT: Para atualizar uma despesa existente ---
export async function PUT(request) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ message: 'ID da despesa é obrigatório' }, { status: 400 });

    const body = await request.json();
    const { description, totalAmount, paymentDate, category, type, installments = 1, accountId } = body;

    await dbConnect();
    const originalExpense = await Expense.findOne({ _id: id, userId });
    if (!originalExpense) return NextResponse.json({ message: 'Despesa não encontrada' }, { status: 404 });

    if (originalExpense.isInstallment || installments > 1) {
      // Para parcelas, a lógica de "deletar e recriar" continua a mesma,
      // pois ela já lida corretamente com o accountId (se ele existir, será adicionado, se não, não).
      const purchaseId = originalExpense.isInstallment ? originalExpense.installmentDetails.purchaseId : new mongoose.Types.ObjectId();
      await Expense.deleteMany({ 'installmentDetails.purchaseId': purchaseId, userId });
      
      const installmentValue = parseFloat((totalAmount / installments).toFixed(2));
      const expensePromises = [];
      for (let i = 0; i < installments; i++) {
        const installmentData = {
          userId,
          description: `${description} (${i + 1}/${installments})`,
          amount: installmentValue,
          paymentDate: addMonths(new Date(paymentDate), i),
          category, type: 'pontual', isInstallment: true,
          installmentDetails: {
            purchaseId: purchaseId,
            currentInstallment: i + 1,
            totalInstallments: installments,
            totalAmount: totalAmount,
          },
        };
        // Adiciona o accountId apenas se ele existir
        if (accountId) {
          installmentData.accountId = accountId;
        }
        expensePromises.push(installmentData);
      }
      await Expense.insertMany(expensePromises);
    } else {
      // --- PARA DESPESA ÚNICA: Lógica explícita de $set e $unset ---
      const updateData = {
        description,
        amount: totalAmount,
        paymentDate,
        category,
        type
      };
      
      // Constrói a operação de atualização dinamicamente
      const updateOperation = {
        $set: updateData
      };

      if (accountId) {
        // Se um accountId foi fornecido, define o valor
        updateOperation.$set.accountId = accountId;
      } else {
        // Se nenhum accountId foi fornecido (string vazia), remove o campo
        updateOperation.$unset = { accountId: "" };
      }
      
      await Expense.findOneAndUpdate({ _id: id, userId }, updateOperation);
    }
    
    return NextResponse.json({ success: true, message: "Despesa atualizada com sucesso!" });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// --- FUNÇÃO DELETE: Para apagar despesas (únicas ou parceladas) ---
export async function DELETE(request) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'ID da despesa é obrigatório' }, { status: 400 });
    }

    await dbConnect();
    const expenseToDelete = await Expense.findOne({ _id: id, userId });

    if (!expenseToDelete) {
      return NextResponse.json({ message: 'Despesa não encontrada ou não pertence ao usuário' }, { status: 404 });
    }

    if (expenseToDelete.isInstallment && expenseToDelete.installmentDetails.purchaseId) {
      const purchaseId = expenseToDelete.installmentDetails.purchaseId;
      await Expense.deleteMany({ 'installmentDetails.purchaseId': purchaseId, userId });
      return NextResponse.json({ success: true, message: 'Toda a compra parcelada foi excluída.' }, { status: 200 });
    } else {
      await Expense.deleteOne({ _id: id, userId });
      return NextResponse.json({ success: true, message: 'Despesa excluída com sucesso.' }, { status: 200 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
