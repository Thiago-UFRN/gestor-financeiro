// Em app/api/reservas/route.js

import dbConnect from '@/lib/dbConnect';
import Savings from '@/models/Savings';
import { NextResponse } from 'next/server';
import { getUserIdFromToken } from '@/lib/auth';
import mongoose from 'mongoose';

// --- FUNÇÃO GET: Para buscar todos os registros de reserva ---
export async function GET(request) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    await dbConnect();
    const savings = await Savings.find({ userId }).sort({ date: -1 });
    return NextResponse.json({ success: true, data: savings });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// --- FUNÇÃO POST: Para criar um novo registro de reserva ---
export async function POST(request) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const savingsData = { ...body, userId };

    const newSaving = await Savings.create(savingsData);
    return NextResponse.json({ success: true, data: newSaving }, { status: 201 });
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

// --- FUNÇÃO DELETE: Para apagar um registro de reserva ---
export async function DELETE(request) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'ID da reserva é obrigatório' }, { status: 400 });
    }

    await dbConnect();
    const deletedSaving = await Savings.findOneAndDelete({ _id: id, userId });

    if (!deletedSaving) {
      return NextResponse.json({ message: 'Registro de reserva não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Registro de reserva excluído' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// --- FUNÇÃO PUT: Para atualizar um registro de reserva ---
export async function PUT(request) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ message: 'ID da reserva é obrigatório' }, { status: 400 });
    }

    const body = await request.json();
    await dbConnect();

    const updatedSaving = await Savings.findOneAndUpdate(
      { _id: id, userId },
      body,
      { new: true, runValidators: true }
    );

    if (!updatedSaving) {
      return NextResponse.json({ message: 'Registro de reserva não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedSaving });
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
