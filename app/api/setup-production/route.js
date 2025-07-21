// Em app/api/setup-production/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function GET() {
  try {
    await dbConnect();
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      throw new Error('Variáveis de admin não configuradas na Vercel');
    }

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      return NextResponse.json({ message: 'Usuário admin já existe.' }, { status: 409 });
    }

    await User.create({
      name: 'Administrador',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
    });

    return NextResponse.json({ success: true, message: 'Usuário admin criado com sucesso!' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
