import { PassThrough } from 'node:stream';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { classifyWithGemini } from '../lib/gemini.js';
import { keywordClassify } from '../lib/classifier.js';

// In-memory job state (single job at a time)
let job = null; // { paused, cancelled }

function resetJob() {
  job = { paused: false, cancelled: false };
}

export default async function aiRoutes(app) {
  // Single-record classify
  app.post('/api/ai/classify', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { docId, photoUrls, desc, hazard } = request.body || {};

    if (!docId) {
      return reply.status(400).send({ error: 'docId required' });
    }

    let urls = photoUrls;
    let description = desc;
    let hazardLabel = hazard;

    if (!urls || !description) {
      const [rows] = await pool.query('SELECT * FROM observations WHERE id = ?', [docId]);
      if (rows.length === 0) {
        return reply.status(404).send({ error: 'Observation not found' });
      }
      const record = rows[0];
      if (!urls) {
        try { urls = typeof record.photos === 'string' ? JSON.parse(record.photos) : record.photos; } catch { urls = []; }
      }
      if (!description) description = record.description;
      if (!hazardLabel) hazardLabel = record.hazard;
    }

    if (!Array.isArray(urls)) urls = [];

    let result;
    if (urls.length > 0) {
      result = await classifyWithGemini(urls, description, hazardLabel);
      if (result.confidence === 'low' && result.reasoning && result.reasoning.includes('No readable images')) {
        result = { ...keywordClassify(description, hazardLabel), confidence: 'low' };
      }
    } else {
      result = { ...keywordClassify(description, hazardLabel), method: 'keyword' };
    }

    result.method = result.method || 'gemini';

    await pool.query(
      `UPDATE observations SET
        ai_category = ?, ai_category_cn = ?, ai_confidence = ?,
        ai_method = ?, ai_reasoning = ?, ai_analyzed_at = NOW()
       WHERE id = ?`,
      [result.category, result.categoryCN, result.confidence, result.method, result.reasoning || '', docId]
    );

    return { success: true, docId, classification: result };
  });

  // Get docIds by scope (no longer starts processing)
  app.post('/api/ai/classify-batch', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { docIds, scope } = request.body || {};

    let ids = docIds || [];
    if (scope === 'unanalyzed') {
      const [rows] = await pool.query("SELECT id FROM observations WHERE ai_category IS NULL OR ai_category = ''");
      ids = rows.map(r => r.id);
    } else if (scope === 'others') {
      const [rows] = await pool.query("SELECT id FROM observations WHERE ai_category = 'Others'");
      ids = rows.map(r => r.id);
    } else if (scope === 'all' || ids.length === 0) {
      const [rows] = await pool.query('SELECT id FROM observations');
      ids = rows.map(r => r.id);
    }

    return { success: true, queued: ids.length, docIds: ids };
  });

  // Run batch classification with streaming progress + pause/cancel
  app.post('/api/ai/classify-batch/run', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { docIds, scope } = request.body || {};

    // Resolve IDs
    let ids = docIds || [];
    if (scope === 'unanalyzed') {
      const [rows] = await pool.query("SELECT id FROM observations WHERE ai_category IS NULL OR ai_category = ''");
      ids = rows.map(r => r.id);
    } else if (scope === 'others') {
      const [rows] = await pool.query("SELECT id FROM observations WHERE ai_category = 'Others'");
      ids = rows.map(r => r.id);
    } else if (scope === 'all' || ids.length === 0) {
      const [rows] = await pool.query('SELECT id FROM observations');
      ids = rows.map(r => r.id);
    }

    // Reset job state
    resetJob();

    const stream = new PassThrough();
    const send = (data) => {
      stream.write(JSON.stringify(data) + '\n');
    };

    reply.type('application/x-ndjson').send(stream);

    try {
      const total = ids.length;
      let done = 0;
      let skipped = 0;
      let errors = 0;

      send({ type: 'start', total, message: `Starting AI classification for ${total} records...` });

      for (let i = 0; i < ids.length; i++) {
        // --- Check cancel flag ---
        if (job.cancelled) {
          send({ type: 'cancelled', done, total, message: `Cancelled after ${done}/${total} records.` });
          stream.end();
          resetJob();
          return;
        }

        // --- Check pause flag ---
        while (job.paused && !job.cancelled) {
          send({ type: 'paused', done, total });
          await sleep(500);
        }
        if (job.cancelled) {
          send({ type: 'cancelled', done, total, message: `Cancelled after ${done}/${total} records.` });
          stream.end();
          resetJob();
          return;
        }

        const docId = ids[i];

        try {
          // Fetch record
          const [rows] = await pool.query('SELECT * FROM observations WHERE id = ?', [docId]);
          if (rows.length === 0) {
            skipped++;
            send({ type: 'log', phase: 'skip', message: `[${i + 1}/${total}] ${docId}: not found` });
          } else {
            const record = rows[0];
            let urls = [];
            try {
              urls = typeof record.photos === 'string' ? JSON.parse(record.photos) : (record.photos || []);
            } catch { urls = []; }
            if (!Array.isArray(urls)) urls = [];

            const description = record.description || '';
            const hazardLabel = record.hazard || '';

            let result;
            if (urls.length > 0) {
              result = await classifyWithGemini(urls, description, hazardLabel);
              if (result.confidence === 'low' && result.reasoning && result.reasoning.includes('No readable images')) {
                result = { ...keywordClassify(description, hazardLabel), confidence: 'low', method: 'keyword' };
              }
            } else {
              result = { ...keywordClassify(description, hazardLabel), method: 'keyword' };
            }
            result.method = result.method || 'gemini';

            await pool.query(
              `UPDATE observations SET
                ai_category = ?, ai_category_cn = ?, ai_confidence = ?,
                ai_method = ?, ai_reasoning = ?, ai_analyzed_at = NOW()
               WHERE id = ?`,
              [result.category, result.categoryCN, result.confidence, result.method, result.reasoning || '', docId]
            );

            done++;
            send({
              type: 'log',
              phase: 'ok',
              message: `[${i + 1}/${total}] ${docId} → ${result.categoryCN || result.category} (${result.method})`,
            });
          }
        } catch (err) {
          errors++;
          send({ type: 'log', phase: 'error', message: `[${i + 1}/${total}] ${docId}: ${err.message}` });
        }

        // Progress update every 10 records
        if ((i + 1) % 10 === 0 || i === ids.length - 1) {
          send({ type: 'progress', current: i + 1, total, done, skipped, errors });
        }

        // Delay between requests
        if (i < ids.length - 1) {
          await sleep(500);
        }
      }

      send({ type: 'done', done, total, skipped, errors });
      stream.end();
      resetJob();
    } catch (err) {
      send({ type: 'error', message: err.message });
      stream.end();
      resetJob();
    }
  });

  // Pause the running job
  app.post('/api/ai/classify-batch/pause', { preHandler: [authMiddleware] }, async (_request, reply) => {
    if (!job) {
      return reply.status(400).send({ error: 'No job running' });
    }
    job.paused = true;
    return { success: true, paused: true };
  });

  // Resume the paused job
  app.post('/api/ai/classify-batch/resume', { preHandler: [authMiddleware] }, async (_request, reply) => {
    if (!job) {
      return reply.status(400).send({ error: 'No job running' });
    }
    job.paused = false;
    return { success: true, paused: false };
  });

  // Cancel the running job
  app.post('/api/ai/classify-batch/cancel', { preHandler: [authMiddleware] }, async (_request, reply) => {
    if (!job) {
      return reply.status(400).send({ error: 'No job running' });
    }
    job.cancelled = true;
    job.paused = false; // unpause so the loop can exit
    return { success: true, cancelled: true };
  });

  // Get current job status
  app.get('/api/ai/classify-batch/status', { preHandler: [authMiddleware] }, async (_request, reply) => {
    if (!job) {
      return { running: false };
    }
    return { running: true, paused: job.paused, cancelled: job.cancelled };
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
