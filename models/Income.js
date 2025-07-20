// Em models/Income.js

import mongoose from 'mongoose';

const IncomeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Referência ao usuário que cadastrou a renda
    required: true,
  },
  description: {
    type: String,
    required: [true, 'A descrição da renda é obrigatória.'],
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, 'O valor da renda é obrigatório.'],
  },
  date: {
    type: Date,
    required: true,
  },
  type: {
    type: String,
    enum: ['mensal', 'intervalo', 'unica'], // Mensal, Por intervalo de tempo, Única
    required: true,
  },
  // Campos para o tipo 'intervalo'
  startDate: { type: Date },
  endDate: { type: Date },
}, {
  timestamps: true,
});

export default mongoose.models.Income || mongoose.model('Income', IncomeSchema);