/**
 * Netlify serverless function for the portfolio chat assistant.
 *
 * Production counterpart to server/dev-server.ts: the Express dev server only
 * runs locally, so on Netlify this function is what answers POST /api/chat.
 * It reuses the exact same Web-standard handler, so behavior stays identical.
 */

import { POST } from '../../app/api/chat/route';

export default async (request: Request): Promise<Response> => {
  return POST(request);
};

export const config = {
  path: '/api/chat',
};
