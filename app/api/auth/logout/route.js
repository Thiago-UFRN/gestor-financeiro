// Em app/api/auth/logout/route.js

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = NextResponse.json(
      { message: "Logout realizado com sucesso!", success: true },
      { status: 200 }
    );

    // "Apaga" o cookie setando sua data de expiração para o passado
    response.cookies.set("token", "", { 
      httpOnly: true, 
      expires: new Date(0) 
    });

    return response;

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}