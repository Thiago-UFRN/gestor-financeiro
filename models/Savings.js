// Em models/Savings.js

import mongoose from 'mongoose';

const SavingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: [true, 'O valor a ser guardado é obrigatório.'],
  },
  date: {
    type: Date,
    default: Date.now,
  },
  sourceDescription: { // "De qual fonte vem esse dinheiro?"
    type: String,
    required: [true, 'A descrição da fonte do dinheiro é obrigatória.'],
    default: 'Entrada manual na reserva'
  },
  sourceIncomeId: { // Opcional: linkar com a renda que originou esta reserva
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Income',
  }
}, {
  timestamps: true
});

export default mongoose.models.Savings || mongoose.model('Savings', SavingsSchema);