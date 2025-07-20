// Em lib/auth.js

import jwt from 'jsonwebtoken';

// Esta função será usada em várias APIs para obter o ID do usuário logado.
export const getUserIdFromToken = (request) => {
  try {
    const token = request.cookies.get('token')?.value || '';
    if (!token) {
      return null;
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    return decodedToken.id; // Retorna apenas o ID do usuário
  } catch (error) {
    console.error("Erro ao decodificar token:", error.message);
    return null;
  }
};
