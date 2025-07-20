// Em models/Expense.js

import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  description: {
    type: String,
    required: [true, 'A descrição da despesa é obrigatória.'],
  },
  amount: { // Este será o valor da despesa do mês (ou valor da parcela)
    type: Number,
    required: [true, 'O valor é obrigatório.'],
  },
  paymentDate: { // Data de vencimento/pagamento desta despesa/parcela
    type: Date,
    required: true,
  },
  category: {
    type: String,
    enum: ['compras_internet', 'mercado', 'assinaturas', 'dividas', 'contas_casa', 'medico_saude', 'entretenimento', 'outros'],
    required: [true, 'A categoria é obrigatória.'],
  },
  type: {
    type: String,
    enum: ['recorrente', 'pontual'],
    required: true,
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: false, // Opcional, nem toda despesa precisa de uma conta (ex: dinheiro)
  },
  isInstallment: { // É uma parcela?
    type: Boolean,
    default: false,
  },
  installmentDetails: {
    purchaseId: { // ID para agrupar todas as parcelas de uma mesma compra
      type: mongoose.Schema.Types.ObjectId, 
    },
    currentInstallment: Number,
    totalInstallments: Number,
    totalAmount: Number, // Valor total do produto
  }
}, {
  timestamps: true,
});

export default mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);