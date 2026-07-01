/**
 * Development API server for the Vite + React portfolio.
 *
 * Vite serves the frontend; this Express server serves /api/* routes.
 * In production, deploy this alongside the static build or migrate the route
 * handler to your hosting platform's serverless functions.
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { POST as chatPOST } from '../app/api/chat/route';
import { POST as analyticsPOST, GET as analyticsGET } from '../app/api/analytics/route';

const app = express();
const PORT = Number(process.env.API_PORT ?? 3001);

app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const request = new Request(`http://localhost:${PORT}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body),
  });

  const response = await chatPOST(request);
  const data = await response.json();

  res.status(response.status).json(data);
});

app.post('/api/analytics', async (req, res) => {
  const request = new Request(`http://localhost:${PORT}/api/analytics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body),
  });

  const response = await analyticsPOST(request);
  const data = await response.json();
  res.status(response.status).json(data);
});

app.get('/api/analytics', async (_req, res) => {
  const response = await analyticsGET();
  const data = await response.json();
  res.status(response.status).json(data);
});

const server = app.listen(PORT, () => {
  console.log(`Portfolio API running at http://localhost:${PORT}`);
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
