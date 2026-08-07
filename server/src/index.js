import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { config } from './config.js';
import { pool } from './db.js';
import authRoutes from './routes/auth.js';
import observationRoutes from './routes/observations.js';
import statsRoutes from './routes/stats.js';
import awardRoutes from './routes/awards.js';
import feedbackRoutes from './routes/feedback.js';
import uploadRoutes from './routes/upload.js';
import aiRoutes from './routes/ai.js';

const app = Fastify({ logger: true, trustProxy: true });

await app.register(cors, {
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.CORS_ORIGIN || 'http://localhost']
    : ['http://localhost:5173', 'http://localhost']
});
await app.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } });

// Serve uploaded photos and proxy fallback
const __dirname = dirname(fileURLToPath(import.meta.url));
// resolve config.uploadDir relative to server/ (__dirname/..) — handles both absolute and relative paths
const uploadRoot = resolve(__dirname, '..', config.uploadDir);
const remoteUploadBase = process.env.REMOTE_UPLOAD_BASE || '';

const MIME_TYPES = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.gif': 'image/gif',
  '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
};

app.get('/uploads/*', async (request, reply) => {
  const relativePath = request.params['*'];
  const filePath = join(uploadRoot, relativePath);

  app.log.info(`[uploads] wildcard=${relativePath} resolved=${filePath} exists=${existsSync(filePath)}`);

  // 1 — serve from local disk
  if (existsSync(filePath)) {
    try {
      const ext = extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'image/jpeg';
      const data = await readFile(filePath);
      return reply.type(contentType).send(data);
    } catch (err) {
      app.log.warn(`[uploads] Read error ${filePath}: ${err.message}`);
    }
  }

  // 2 — proxy from remote server (local dev only)
  if (remoteUploadBase) {
    try {
      const remoteUrl = `${remoteUploadBase.replace(/\/+$/, '')}${request.url}`;
      const res = await fetch(remoteUrl, { signal: AbortSignal.timeout(15000) });
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        const contentType = res.headers.get('content-type') || 'image/jpeg';

        // cache locally
        try {
          const localDir = dirname(filePath);
          if (!existsSync(localDir)) await mkdir(localDir, { recursive: true });
          await writeFile(filePath, buffer);
        } catch {}

        return reply.type(contentType).send(buffer);
      }
    } catch {}
  }

  // Return debug info so we can see what's happening
  return reply.status(404).send({
    error: 'Image not found',
    debug: { wildcard: relativePath, resolved: filePath, uploadRoot, configUploadDir: config.uploadDir },
  });
});

if (remoteUploadBase) {
  app.log.info(`Image proxy enabled → ${remoteUploadBase}`);
}

// Health check
app.get('/api/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

// DB health check
app.get('/api/health/db', async () => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    return { db: rows[0].ok === 1 ? 'connected' : 'error' };
  } catch {
    return { db: 'error' };
  }
});

// Auth routes
await authRoutes(app);

// Observations CRUD routes
await observationRoutes(app);

// Stats aggregation route
await statsRoutes(app);

// Awards routes
await awardRoutes(app);

// Feedback routes
await feedbackRoutes(app);

// Upload routes
await uploadRoutes(app);

// AI classification routes
await aiRoutes(app);

// Global error handler — hide internals in production
app.setErrorHandler((error, request, reply) => {
  app.log.error(error);
  const isDev = process.env.NODE_ENV !== 'production';
  reply.status(error.statusCode || 500).send({
    error: isDev ? error.message : 'Internal server error',
  });
});

const gracefulShutdown = async (signal) => {
  app.log.info(`Received ${signal}, shutting down gracefully...`);
  try {
    await app.close();
    await pool.end();
    process.exit(0);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

async function start() {
  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    app.log.info(`Server running on port ${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
start();
