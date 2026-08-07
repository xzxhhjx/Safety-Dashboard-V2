import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
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

// Serve uploaded photos
const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadRoot = join(__dirname, '..', config.uploadDir);
await app.register(fastifyStatic, {
  root: uploadRoot,
  prefix: '/uploads/',
  decorateReply: false,
});

// Image proxy fallback — fetch missing images from remote production server
const remoteUploadBase = process.env.REMOTE_UPLOAD_BASE;
if (remoteUploadBase) {
  app.setNotFoundHandler(async (request, reply) => {
    // Only intercept /uploads/ paths; everything else gets normal 404
    if (!request.url.startsWith('/uploads/')) {
      return reply.status(404).send({ error: 'Not found' });
    }

    try {
      const remoteUrl = `${remoteUploadBase.replace(/\/+$/, '')}${request.url}`;
      app.log.info(`[image-proxy] Fetching ${remoteUrl}`);

      const res = await fetch(remoteUrl, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) {
        return reply.status(404).send({ error: 'Image not found on remote' });
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers.get('content-type') || 'image/jpeg';

      // Cache locally so next request hits the disk
      try {
        const relativePath = request.url.replace('/uploads/', '');
        const localPath = join(uploadRoot, relativePath);
        const localDir = dirname(localPath);
        if (!existsSync(localDir)) {
          await mkdir(localDir, { recursive: true });
        }
        await writeFile(localPath, buffer);
        app.log.info(`[image-proxy] Cached → ${relativePath}`);
      } catch (cacheErr) {
        app.log.warn(`[image-proxy] Cache write failed: ${cacheErr.message}`);
      }

      return reply.type(contentType).send(buffer);
    } catch (err) {
      app.log.warn(`[image-proxy] Failed ${request.url}: ${err.message}`);
      return reply.status(404).send({ error: 'Image not available' });
    }
  });

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
