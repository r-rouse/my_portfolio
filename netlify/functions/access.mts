/**
 * Netlify Function — /api/access
 */

import type { Config, Context } from '@netlify/functions';
import { POST } from '../../app/api/access/route';

export default async function handler(
  request: Request,
  _context: Context
): Promise<Response> {
  if (request.method === 'POST') {
    return POST(request);
  }

  return Response.json({ error: 'Method Not Allowed' }, { status: 405 });
}

export const config: Config = {
  path: '/api/access',
};
