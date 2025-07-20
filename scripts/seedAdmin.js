// scripts/seedAdmin.js

const mongoose = require('mongoose');
// Usamos require() aqui porque este é um script Node.js padrão, não um módulo ES6 do Next.js
const User = require('../models/User').default;

// Carrega as variáveis de ambiente do arquivo .env.local
require('dotenv').config({ path: './.env.local' });

const seedAdmin = async () => {
  const MONGODB_URI = process.env.MONGODB_URI;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (!MONGODB_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('ERRO: Variáveis de ambiente MONGODB_URI, ADMIN_EMAIL, ou ADMIN_PASSWORD não estão definidas.');
    process.exit(1);
  }

  try {
    console.log('Conectando ao MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado com sucesso!');

    // 1. Verifica se o usuário admin já existe
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });

    if (existingAdmin) {
      console.log('Usuário admin já existe. Nenhuma ação necessária.');
      return; // Encerra o script se o admin já foi criado
    }

    // 2. Se não existir, cria o novo usuário admin
    console.log('Criando usuário admin...');
    const adminUser = new User({
      name: 'Administrador',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD, // A senha será hasheada pelo middleware do Schema
      role: 'admin'
    });

    await adminUser.save();
    console.log('✅ Usuário admin criado com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao executar o script de seed:', error);
    process.exit(1);
  } finally {
    // 3. Garante que a conexão com o banco de dados será fechada
    console.log('Desconectando do MongoDB...');
    await mongoose.disconnect();
    console.log('Desconectado.');
  }
};

// Executa a função
seedAdmin();
