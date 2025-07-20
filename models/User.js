// Em models/User.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs'; // Importamos o bcrypt aqui também

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'O nome é obrigatório.'],
  },
  email: {
    type: String,
    required: [true, 'O e-mail é obrigatório.'],
    unique: true, // Garante que não haverá dois usuários com o mesmo e-mail
    match: [/.+@.+\..+/, 'Por favor, insira um e-mail válido.'],
  },
  password: {
    type: String,
    required: [true, 'A senha é obrigatória.'],
    select: false, // Impede que a senha seja retornada em queries por padrão
  },
  role: {
    type: String,
    enum: ['admin', 'member'], // O usuário só pode ter uma dessas duas funções
    default: 'member',
  },
}, { 
  timestamps: true // Adiciona os campos createdAt e updatedAt automaticamente
});

// Middleware (pré-save) para fazer o hash da senha antes de salvar no banco
UserSchema.pre('save', async function(next) {
  // Só faz o hash se a senha foi modificada (ou é nova)
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (error) {
    return next(error);
  }
});

export default mongoose.models.User || mongoose.model('User', UserSchema);