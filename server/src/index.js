import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
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
await app.register(fastifyStatic, {
  root: join(__dirname, '..', config.uploadDir),
  prefix: '/uploads/',
  decorateReply: false,
});

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
