/**
 * Development API server for the Vite + React portfolio.
 *
 * Vite serves the frontend; this Express server serves /api/* routes.
 * In production, deploy this alongside the static build or migrate the route
 * handler to your hosting platform's serverless functions.
 */

import 'dotenv/config';
import express, { type Request as ExpressRequest, type Response as ExpressResponse, type NextFunction } from 'express';
import cors from 'cors';
import { POST as chatPOST } from '../app/api/chat/route';
import { POST as analyticsPOST, GET as analyticsGET } from '../app/api/analytics/route';
import {
  DELETE as journalDELETE,
  GET as journalGET,
  POST as journalPOST,
} from '../app/api/journal/route';
import { getAllowedOrigins, isOriginAllowed } from '../lib/security/cors';

const app = express();
const PORT = Number(process.env.API_PORT ?? 3001);

app.disable('x-powered-by');

app.use(
  cors({
    origin(origin, callback) {
      if (isOriginAllowed(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origin not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-journal-code'],
    maxAge: 600,
  })
);

app.use(express.json({ limit: '64kb' }));

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cache-Control', 'no-store');
  next();
});

app.use((error: Error, _req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
  if (error?.message === 'Origin not allowed by CORS') {
    res.status(403).json({ error: 'Origin not allowed' });
    return;
  }
  if (error instanceof SyntaxError) {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }
  next(error);
});

async function sendWebResponse(res: ExpressResponse, response: Response): Promise<void> {
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  const data = await response.json();
  res.status(response.status).json(data);
}

app.post('/api/chat', async (req, res) => {
  const request = new Request(`http://localhost:${PORT}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': req.ip ?? '',
    },
    body: JSON.stringify(req.body),
  });

  await sendWebResponse(res, await chatPOST(request));
});

app.post('/api/analytics', async (req, res) => {
  const request = new Request(`http://localhost:${PORT}/api/analytics`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': req.ip ?? '',
    },
    body: JSON.stringify(req.body),
  });

  await sendWebResponse(res, await analyticsPOST(request));
});

app.get('/api/analytics', async (req, res) => {
  const request = new Request(`http://localhost:${PORT}/api/analytics`, {
    method: 'GET',
    headers: {
      'x-forwarded-for': req.ip ?? '',
    },
  });
  await sendWebResponse(res, await analyticsGET(request));
});

function journalRequest(req: ExpressRequest, method: string): Request {
  const url = new URL(req.originalUrl, `http://localhost:${PORT}`);
  const headers = new Headers();
  const code = req.header('x-journal-code');
  if (code) {
    headers.set('x-journal-code', code);
  }
  if (method !== 'GET' && method !== 'DELETE') {
    headers.set('Content-Type', 'application/json');
  }
  if (req.ip) {
    headers.set('x-forwarded-for', req.ip);
  }

  return new Request(url, {
    method,
    headers,
    body: method === 'POST' ? JSON.stringify(req.body) : undefined,
  });
}

app.get('/api/journal', async (req, res) => {
  await sendWebResponse(res, await journalGET(journalRequest(req, 'GET')));
});

app.post('/api/journal', async (req, res) => {
  await sendWebResponse(res, await journalPOST(journalRequest(req, 'POST')));
});

app.delete('/api/journal', async (req, res) => {
  await sendWebResponse(res, await journalDELETE(journalRequest(req, 'DELETE')));
});

const server = app.listen(PORT, () => {
  console.log(`Portfolio API running at http://localhost:${PORT}`);
  console.log(`Allowed CORS origins: ${getAllowedOrigins().join(', ')}`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `\nPort ${PORT} is already in use. Either:\n` +
        `  • Stop the other process: lsof -ti :${PORT} | xargs kill -9\n` +
        `  • Or set a different port: API_PORT=3002 npm run dev\n`
    );
    process.exit(1);
  }

  throw error;
});
