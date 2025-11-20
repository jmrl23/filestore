import { API_KEY } from '@/config/env';
import { FastifyRequest } from 'fastify';
import { Unauthorized } from 'http-errors';

export async function requiredAuth(request: FastifyRequest) {
  const headers = request.headers;
  const apiKey = headers['x-api-key'];
  if (apiKey !== API_KEY) {
    throw new Unauthorized('Unauthorized');
  }
}
