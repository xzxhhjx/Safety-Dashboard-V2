import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export async function authMiddleware(request, reply) {
  const header = request.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Missing or invalid token' });
  }
  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret);
    request.user = payload;
  } catch {
    return reply.status(401).send({ error: 'Token expired or invalid' });
  }
}
