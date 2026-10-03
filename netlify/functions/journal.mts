/**
 * Netlify Function — /api/journal
 */

import type { Config, Context } from '@netlify/functions';
import { DELETE, GET, POST } from '../../app/api/journal/route';

export default async function handler(
  request: Request,
  _context: Context
): Promise<Response> {
  if (request.method === 'GET') {
    return GET(request);
  }

  if (request.method === 'POST') {
    return POST(request);
  }

  if (request.method === 'DELETE') {
    return DELETE(request);
  }

  return Response.json({ error: 'Method Not Allowed' }, { status: 405 });
}

export const config: Config = {
  path: '/api/journal',
};
