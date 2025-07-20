// Em models/Account.js

import mongoose from 'mongoose';

const AccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: { // Ex: "Conta Corrente Itaú", "Nubank Ultravioleta"
    type: String,
    required: [true, 'O nome da conta é obrigatório.'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['bank_account', 'credit_card'],
    required: true,
  },
  color: { // Ex: "#820AD1" (cor do Nubank)
    type: String,
    default: '#718096', // Um cinza padrão
  },
  // Detalhes específicos para cartões de crédito
  cardDetails: {
    holderName: { type: String, trim: true },
    last4Digits: { type: String, trim: true },
  },
}, {
  timestamps: true
});

export default mongoose.models.Account || mongoose.model('Account', AccountSchema);
